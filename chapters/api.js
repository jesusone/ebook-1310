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
var async = require('async');

function getModel () {
  return require('./model-' + config.get('DATA_BACKEND'));
}

var router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: false}));
/**
 * GET /api/categories
 *
 * Retrieve a page of books (up to ten at a time).
 */
var snack = {};
snack.ChapterByID = function(items,callback){

};

snack.MapQuiz = function(items,callback){
//
  var chapter_id = items.id;
  getModel().listQuizByChaID(chapter_id,10, true, function (err, entities, cursor) {
    if (err) {
      return next(err);
    }
    var quiz_list = {
      items: entities,
      nextPageToken: cursor
    };
    items.quiz_id = quiz_list;
     callback(null,items);
  });

}
snack.ListsChapters = function(book_id,user_id,token,callback){
  getModel().list(book_id,10, token, function (err, entities, cursor) {
    if (err) {
      return next(err);
    }
    var chapters = {
      items: entities,
      nextPageToken: cursor
    }
    console.log('==========================');
    console.log(chapters);
    callback(null,chapters);
  });
}
snack.RunApi = function(book_id,user_id,token,callback){
  snack.ListsChapters(book_id,user_id,token,function(err,results){
    console.log('==========RESULT=============');
    console.log(results);
    async.map(results.items,snack.MapQuiz,function(err,chapters){
      callback(null,results);
    });
  });

}
router.get('/', function list (req, res, next) {
  var user_id =  req.query.user_id;
  var book_id =  req.query.book_id;
  /*Check user in books*/
  snack.RunApi(book_id, user_id, req.query.nextPageToken ,function(err, result) {
    if(err){
      console.log(err);
    }else {
      res.json(result);
    }
  });

});

/**
 * POST /api/categories
 *
 * Create a new book.
 */
router.post('/', function insert (req, res, next) {

  getModel().create(req.body, function (err, entity) {
    if (err) {
      return next(err);
    }
    /*Update books*/
    update_books(entity);
    res.json(entity);

    });

});
function update_books(entity){
  //Update books kind
  var books_id = entity.book_id
  var chapter_id = entity.id
  var books;
  /*Query books*/
  getModel().read_books(books_id, function (err, entity) {
    if (err) {
      return next(err);
    }
    books = entity;
    if(books.chapter_id){
      books.chapter_id = books.chapter_id+','+chapter_id;
    }
    else {
      books.chapter_id =chapter_id;
    }
    getModel().update_books(books_id, books, function (err, entity) {
      if (err) {
        return next(err);
      }
      return entity;
    });
  });
}

/**
 * GET /api/categories/:id
 *
 * Retrieve a book.
 */
router.get('/:book', function get (req, res, next) {
  getModel().read(req.params.book, function (err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

/**
 * PUT /api/categories/:id
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
