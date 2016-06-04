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
  var user_id = req.query.user_id;
  getModel().read(req.params.book, function (err, entity) {
    global.entity = entity;
    if (err) {
      return next(err);
    }
    if(entity.cat_ids != ''){
      /*Split Cart*/
      var cat_ids =  entity.cat_ids.split(',');

      for(var key in cat_ids){
        getModel().list_categories(cat_ids[key],10, req.query.pageToken, function (err, cat_list, cursor_page) {
          if (err) {
            return next(err);
          }
          var cat_list = {
            items: cat_list,
            nextPageToken: cursor_page
          };
          entity.cat_ids = cat_list;

          for(var key in entity.cat_ids.items){
           if(entity.cat_ids.items[key].book_ids != '' || entity.cat_ids.items[key] != undefined){
             var cat_ids =  entity.cat_ids.items[key].book_ids.split(',');
              if(cat_ids != null){
                for(var key in cat_ids ){
                 getModel().list_books(cat_ids[key],10, req.query.pageToken, function (err, list_books, cursor_page) {
                    if (err) {
                      return next(err);
                    }
                    var list_books = {
                      items: list_books,
                      nextPageToken: cursor_page
                    };
                   for(key in entity.cat_ids.items){
                      entity.cat_ids.items[key].book_ids = list_books;
                     for(var key in entity.cat_ids.items[key].book_ids.items){
                        if(entity.cat_ids.items[key].book_ids.items[key].user_buy.indexOf(user_id) > -1 ){
                          entity.cat_ids.items[key].book_ids.items[key].user_buy = 1;
                          entity.cat_ids.items[key].book_ids.items[key].links_download = 'https://ebook-1310.appspot.com/libs/books/books-'+req.params.book+'.zip';
                        }
                        else {
                          entity.cat_ids.items[key].book_ids.items[key].user_buy = 0;

                        }

                      }
                     res.json(entity);
                     return false;
                    }
                  });

                }

                /*End For Categories*/
              }
           }
          }

        }); /*End modedd carts*/


      }
    }
    res.json(entity);

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
