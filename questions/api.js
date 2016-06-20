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
var waterfall = require('async-waterfall');

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

/*===========================API GET QUESTION DETAIL===================*/
/**
 * GET /api/books/:id
 *
 * Retrieve a book.
 */

var snack = {};

/*GET QUESTION*/
snack.QuesionDetail = function(id, user_id, callback) {
  var id = parseInt(id);
  if (!isNaN(id)) {
    getModel().read(id, function(err, entity) {
      if (err) {
        console.log(err);
        return callback(err);
      }
      callback(null, entity);
    });
  }

}
/*LIST ANSWER*/
snack.DbQuizsByChapterId = function(chapteritem, callback) {
  var cat_id = chapteritem.id;

  if (!isNaN(cat_id)) {
    getModel().DbQuizsByChapterId(cat_id, 10, true, function (err, entities, cursor) {
      var lisquizs = {
        items: entities,
        nextPageToken: false
      }
      chapteritem.quiz_id = lisquizs;
      callback(null, chapteritem);

    });
  }

}
/*Get Answers*/
snack.AnswersDetailByQuestionID = function(id,callback) {

  getModel().DbAnswerDetailByID(id, 10, true, function(err, entities, cursor){
    if (err) {
      return callback(err);
    }
    callback(null, entities);
  });

}
/*Block Lists*/
snack.BlockDetailByQuestionID = function (question_id,callback) {
  getModel().DbBlockDetailByID(question_id, 10, true, function(err, entities, cursor){
    if (err) {
      return callback(err);
    }
    callback(null, entities);
  });

}
/*Answers LIST*/
snack.Answers = function(question_id, user_id, callback) {
  snack.QuesionDetail(question_id, user_id, function(err, result) {
      var answer_id = {
          items:'',
          nextPageToken:false
      }
       snack.AnswersDetailByQuestionID(question_id,function(err, chapterResult) {
        if (err) {
          return callback(err);
        }
         answer_id.items = chapterResult;
         result.answer_id = chapterResult;
         callback(null, result);
      });
     snack.BlockDetailByQuestionID()


  });
}
/*GET */


snack.QuestionAnswers = function(book_id, user_id, fcallback) {
  //setparams:

  var param_question = {'question_id':book_id,'is_trues':''}


 /* snack.Answers(book_id, user_id, function(err, result) {
    //Question Id Parents

      //List answers
      var param_question = {'question_id':book_id,'is_trues':''}
      snack.AnswersDetailByQuestionID(param_question,function(err,answers){
        result.answer_id =  answers;
          /!*Get Answer True*!/

          snack.BlockDetailByQuestionID(param_question,function(err,blocks){
            result.block_id = blocks;
            param_question.is_trues = '1';
            snack.AnswersDetailByQuestionID(param_question,function(err,blocks){
                if(err){
                  callback(err);
                }
                else{
                  callback(null,result);
                }
            })
          })
      })



  });*/
}

router.get('/:book', function get (req, res, next) {
  var user_id = req.query.user_id;
  var question = req.params.book;
  async.parallel([
        function(callback){
            console.log(question);
          var id = question;
            callback(null,id);

        },
        function(callback){
            callback(null, 'ssssjsj');

        }
      ],
// optional callback
      function(err, results){
        console.log(results);
        // the results array will equal ['one','two'] even though
        // the second function had a shorter timeout.
      });
  /*snack.QuestionAnswers(question, user_id, function(err, result) {
    if(err){
      console.log(err);
    }else {
      res.json(result);
    }
  });*/
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
