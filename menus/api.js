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

var snack  = {};
snack.menuItem  = function(menu_id,user_id,callback){
   var menu_id =  parseInt(menu_id);
  if(!isNaN(menu_id)){
    getModel().read(menu_id, function (err, entity) {
      if(err) {
        console.log(err);
        return next(err);
      }
      callback(null,entity);
    });
  }
}
snack.Category = function(menu_id,user_id,cat_id,callback){
  getModel().list_categories(cat_id,10, true ,function (err, entities,  cursor) {
    if (err) {
      return next(err);
    }
    callback(null,entities);
  });
}

snack.Categories  = function(menu_id,user_id,callback){
  snack.menuItem(menu_id,user_id,function(err,result){
    var cat_ids =  result.cat_ids.split(',');
    result.cat_ids = { items: [],
      nextPageToken: false};
    console.log(result);
      for(var key in cat_ids){
        snack.Category(menu_id,user_id,cat_ids[key],function(err,cat_id){
          result.cat_ids.items.push(cat_id);
          console.log(result);

        });
      }
    callback(null,result);
  })

}
snack.books = function(menu_id,user_id,callback){
  snack.Categories(menu_id,user_id,function(err,result){
    console.log('check'+result);
    callback(null,result);

  });
}


async.parallel(snack, function(err, results) {
  res.json(results);
});
router.get('/:book', function get (req, res, next) {
   var user_id = req.query.user_id;
   snack.books(req.params.book,user_id,function(err,result){
     res.json(result);
     return false;
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
