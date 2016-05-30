// Copyright 2015-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var config = require('../config');

function getModel () {
  return require('./model-' + config.get('DATA_BACKEND'));
}

var router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: false}));
var multer = require('multer')({
  inMemory: true,
  fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
});

router.post('/upload', multer.single('file'), function(req, res, next) {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Create a new blob in the bucket and upload the file data.
  var blob = bucket.file(req.file.originalname);
  var blobStream = blob.createWriteStream();

  blobStream.on('error', function(err) {
    return next(err);
  });

  blobStream.on('finish', function() {
    // The public URL can be used to directly access the file via HTTP.
    var publicUrl = format(
        'https://storage.googleapis.com/%s/%s',
        bucket.name, blob.name);
    res.status(200).send(publicUrl);
  });

  blobStream.end(req.file.buffer);
});

/**
 * GET /api/books
 *
 * Retrieve a page of books (up to ten at a time).
 */

router.get('/', function list (req, res, next) {
  getModel().list(10, req.query.pageToken, function (err, entities, cursor) {
    if (err) {
      return next(err);
    }
    res.json({
      items: entities,
      nextPageToken: cursor
    });
  });
});

/**
 * POST /api/books
 *
 * Create a new book.
 */
router.post('/', function insert (req, res, next) {
  getModel().create(req.body, function (err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

/**
 * GET /api/books/:id
 *
 * Retrieve a book.
 */
router.get('/:book', function get (req, res, next) {
  getModel().read(req.params.book, function (err, entity) {
    if (err) {
      return next(err);
    }
    getModel().list_chapter_by_book_id(req.params.book,10, req.query.pageToken, function (err, entities,  cursor) {
      if (err) {
        return next(err);
      }
      if(entities){
        entity.chapter_id = entities;
        res.json(entity);
        return false
      }
      res.json(entity);
    });

  });
});

/**
 * PUT /api/books/:id
 *
 * Update a book.
 */
router.put('/:book', function update (req, res, next) {
  getModel().update(req.params.book, req.body, function (err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

/**
 * DELETE /api/books/:id
 *
 * Delete a book.
 */
router.delete('/:book', function _delete (req, res, next) {
  getModel().delete(req.params.book, function (err) {
    if (err) {
      return next(err);
    }
    res.status(200).send('OK');
  });
});

/**
 * Errors on "/api/books/*" routes.
 */
router.use(function handleRpcError (err, req, res, next) {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = {
    message: err.message,
    internalCode: err.code
  };
  next(err);
});

module.exports = router;
