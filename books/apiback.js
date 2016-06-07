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


/**
 * GET /api/books
 *
 * Retrieve a page of books (up to ten at a time).
 */

router.get('/', function list (req, res, next) {
  var user_id = req.query.user_id;

  getModel().list(10, req.query.pageToken, function (err, entities, cursor) {
    if (err) {
      return next(err);
    }
    if(entities){

      for(var key in entities){
          if(entities[key].user_buy.indexOf(user_id) > -1 ){
            entities[key].is_buy = 1;
          }
          else {
            entities[key].is_buy = 0;
          }
      }
      res.json({
        items: entities,
        nextPageToken: cursor
      });
      return false;
    }

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
/*==============Parallel=================*/
/*==============End=================*/

/**
 * GET /api/books/:id
 *
 * Retrieve a book.
 */
router.get('/:book', function get (req, res, next) {
    var user_id = req.query.user_id;
  getModel().read(req.params.book, function (err, entity) {
    if (err) {
      return next(err);
    }
      if(entity.user_buy.indexOf(user_id) > -1 ){
          entity.is_buy = 1;
          entity.links_download = 'https://ebook-1310.appspot.com/libs/books/books-'+req.params.book+'.zip';
      }
      else {
          entity.is_buy = 0;
      }

      getModel().list_chapter_by_book_id(req.params.book,10, req.query.pageToken,function (err, entities,  cursor) {
          if (err) {
              return next(err);
          }

          var chapter_ids = {
              items: entities,
              nextPageToken: cursor
          };
          if(entities){
              /*Get quiz*/
              entity.chapter_ids = chapter_ids;
              for(var key in entity.chapter_ids.items){
                  //Get quiz//
                  getModel().list_quiz(entity.chapter_ids.items[key].id,10, req.query.pageToken, function (err, quizs, cursor_page) {
                      if (err) {
                          return next(err);
                      }
                      var quiz_id = {
                          items: quizs,
                          nextPageToken: cursor_page
                      };
                      entity.chapter_ids.items[key].quiz_ids = quiz_id;
                      /*Check user by*/
                      books_proty.push(entity);

                      /*End user by*/

                  });


              }
          }
      });

      res.json(books_proty);
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
snack.Chapters(book_id, user_id, function(err, result) {
    var app_quiz = [];
    var app_quiz_test = [];
    async.map(result.chapter_id.items,snack2.ListQuiz, function (err, quizsReslt) {
        app_quiz.push(quizsReslt);
        var temp = 0;
        quizsReslt.forEach(function (item) {
            app_quiz_test.push(item[temp]);
            temp = temp +1;
            if(temp == quizsReslt.length){
                // Lam cai chi thi lam trong ni ne
                // Khi lap xong thi thich lam chi thi lam o day
            }
        },function(err) {
            callback(null,app_quiz_test);
        });

    });
});