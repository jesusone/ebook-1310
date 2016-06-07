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
/*
 * Create a new book.
 */
router.post('/add_questions/', function insert (req, res, next) {
  getModel().create_quiz_questions(req.body, function (err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

/**
 * GET /api/books/:id
 *
 * Retrieve a quiz.
 */

var snack = {};
var snack2 = {};
snack.QuizDetailts = function(id, user_id, callback) {
  var id = parseInt(id);
  if (!isNaN(id)) {
    getModel().DbReadQuizDetail(id, function(err, entity) {
      if (err) {
        console.log(err);
        return callback(err);
      }

      console.log('===============BOOKDETAIL=====================');
      console.log(entity);
      console.log('=============END BOOKDETAIL===================');
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
snack2.GetChapterById = function(id, callback) {
  if (!isNaN(parseInt(id))) {
    getModel().ChapterDetailByID(id, 10, true, function(err, entities, cursor) {
      if (err) {
        return callback(err);
      }
      /* console.log("======================CHAPTER=================");
       console.log(entities);
       console.log(id);
       console.log("======================END CHAPTER=================");*/
      callback(null, entities);
    });
  }
}
snack2.QuestionDetailByQuizID = function(id, callback){
  getModel().DbQuestionDetailByQuizID(id, 10, true, function(err, entities, cursor){
    if (err) {
      return callback(err);
    }
    console.log("======================CHAPTER LIST=================");
    console.log(entities);
    console.log("======================END CHAPTER LIST==================");
    callback(null, entities);
  });

}
snack2.ListQuizsByChapterID = function(id, callback){

  getModel().DbQuizsByChapterId(id,10,true,function(err, entities, cursor){
    var lisquizs = {
      items:entities,
      nextPageToken:false
    }
    callback(null, lisquizs);

  });

}
snack.QuestionsByQuizID = function(quiz_id, user_id, callback) {
  snack.QuizDetailts(quiz_id, user_id, function(err, result) {
    var question_ids = result.question_id.split(',');
    var questions = {
        items:'',
        nextPageToken:false
    }
    snack2.QuestionDetailByQuizID(quiz_id,function(err, chapterResult) {
      if (err) {
        return callback(err);
      }
      questions.items = chapterResult;
      result.question_id = questions;
       console.log("======================CHAPTER HUNG=================");
       console.log(chapterResult);
       console.log("======================END CHAPTER HUNG=================");

      callback(null, result);
    });



  });
}
snack2.ListQuiz = function(cat_id, callback) {
  /* var test = {'name':'Chautrieu'};
   callback(null, test);
   return false;*/
  /* console.log("------------Quiz ID---------");*/
  for(var key in cat_id){
    var cat_id = cat_id[key];
  }

  getModel().DbQuizsByChapterId(cat_id,10,true,function(err, entities, cursor){
    var lisquizs = {
      items:entities,
      nextPageToken:false
    }
    /* console.log("------------ListQuiz MAP ROI---------");
     console.log(lisquizs);
     console.log("------------END ListQuiz---------");*/
    callback(null, lisquizs);

  });



}
snack.Question = function(quiz_id, user_id, callback) {
  snack.QuestionsByQuizID(quiz_id, user_id, function(err, result) {
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


router.get('/:book', function get (req, res, next) {
  var user_id = req.query.user_id;
  var book_id = req.params.book;
  snack.Question(book_id, user_id, function(err, result) {
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
