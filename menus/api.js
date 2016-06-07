// Copyright 2015-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
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

function getModel() {
  return require('./model-' + config.get('DATA_BACKEND'));
}

var router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
  extended: false
}));
/**
 * GET /api/books
 *
 * Retrieve a page of books (up to ten at a time).
 */

router.get('/', function list(req, res, next) {
  getModel().list(10, req.query.pageToken, function(err, entities, cursor) {
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
router.post('/', function insert(req, res, next) {
  getModel().create(req.body, function(err, entity) {
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

var snack = {};
var snack2 = {};
snack.menuItem = function(menu_id, user_id, callback) {
  var menu_id = parseInt(menu_id);
  if (!isNaN(menu_id)) {
    getModel().read(menu_id, function(err, entity) {
      if (err) {
        console.log(err);
        return callback(err);
      }
      console.log(entity);
      callback(null, entity);
    });
  }
}
snack2.GetBookById  = function(book_id, callback) {

  if (!isNaN(parseInt(book_id))) {

    getModel().list_books(book_id, 10, true, function(err, entities, cursor) {
      if (err) {
        return callback(err);
      }

      callback(null, entities);
    });
  }
}
snack2.GetCategoryById = function(cat_id, callback) {
  if (!isNaN(parseInt(cat_id))) {

    getModel().list_categories(cat_id, 10, true, function(err, entities, cursor) {
      if (err) {
        return callback(err);
      }

      callback(null, entities);
    });
  }
}

snack.Categories = function(menu_id, user_id, callback) {
  snack.menuItem(menu_id, user_id, function(err, result) {
    var cat_ids = result.cat_ids.split(',');
    var categories = {
      items:[],
      nextPageToken:false
    }

    async.map(cat_ids,snack2.GetCategoryById,function(err, cb) {
      for(var i = 0; i < cb.length; i++){
        var e = cb[i];
        for(var j = 0; j < e.length; j++){
          if(e[j] != null){
            categories.items.push(e[j]);
          }
        }
      }
      result.cat_ids = categories;
      callback(null, result);
    });
  });
}
snack2.ListBooks = function(cat_id, user_id, callback) {
  console.log(cat_id);
  var book_ids = cat_id.split(',');

  var books = {
    items:[],
    nextPageToken:false
  }

  async.map(book_ids,snack2.GetBookById,function(err, cb) {
    for(var i = 0; i < cb.length; i++){
      var e = cb[i];
      for(var j = 0; j < e.length; j++){
        if(e[j] != null){
          books.items.push(e[j]);
        }
      }
    }
    callback(null, books);
  });
}
snack.books = function(menu_id, user_id, callback) {
  snack.Categories(menu_id, user_id, function(err, result) {

    for(var key in result.cat_ids.items){

     /* snack2.ListBooks(result.cat_ids.items[key].book_ids,user_id,function(err, books){
        result.cat_ids.items[key].book_ids = books;

      });*/

      if(key == 0){
        console.log('=========VAO KEY 0===========');
        result.cat_ids.items[0].book_ids = {'items':[
          {
            "id": 5706163895140352,
            "description": "Lý",
            "oderby": "1",
            "rate": "36",
            "isbanner": "1",
            "role": "1,2,3,4,5",
            "user_buy": "",
            "price": "50000",
            "view": "12",
            "name": "Hoa",
            "cat_id": "5644406560391168",
            "chapter_id": "5634612826996736,5657382461898752,5674368789118976",
            "author": "Chau Trieu",
            "conver": "http://cdn.online-convert.com/images/image-converter.png",
            "is_buy": 0
          },
          {
            "id": 5642779036221440,
            "description": "Hóa",
            "oderby": "1",
            "rate": "36",
            "isbanner": "1",
            "points": "123",
            "role": "1,2,3,4,5",
            "user_buy": "5670405876482048",
            "price": "12000",
            "view": "12",
            "name": "Hóa",
            "cat_id": "5644406560391168",
            "chapter_id": "5713573250596864,5657382461898752,5674368789118976",
            "author": "Chau Trieu",
            "conver": "http://cdn.online-convert.com/images/image-converter.png",
            "is_buy": 0
          }
        ]}
        console.log('=========jehshshshs===========');
        console.log( result.cat_ids.items[0].book_ids);
      }

      if(key == 1){
        result.cat_ids.items[1].book_ids = {'items':[
          {
            "id": 5733311175458816,
            "description": "Toán",
            "oderby": "1",
            "rate": "36",
            "isbanner": "1",
            "role": "1,2,3,4,5",
            "user_buy": "",
            "price": "10000",
            "view": "12",
            "name": "Toán",
            "chapter_id": "5759409141579776,5710999223009280,5641142922117120,5634612826996736,5700239927279616,5682747733442560",
            "author": "Chau Trieu",
            "conver": "http://cdn.online-convert.com/images/image-converter.png",
            "is_buy": 0
          },
        ]}
      }

    }
    if(err){
      return callback(err)
    }else {
      return callback(null, result);
    }

  });
}
async.parallel(snack, function(err, results) {
  console.log('REPONSIVE');
  console.log(result);
  res.json(results);
});

router.get('/:book', function get(req, res, next) {
  var user_id = req.query.user_id;
  var menu_id = req.params.book;
  snack.books(menu_id, user_id, function(err, result) {
    if(result){
      res.json(result);

      return false;
    }

    return false;
    if(err){
      console.log(err);
    }else {
      return res.json(result);
    }
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
