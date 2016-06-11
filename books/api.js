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
var snack = {};
var snack2 = {};
var snack3 = {};

snack.BookDetailts = function(id, user_id, callback) {
    var id = parseInt(id);
    if (!isNaN(id)) {
        getModel().read(id, function(err, entity) {
            if (err) {
                console.log(err);
                return callback(err);
            }

                if(entity.user_buy.indexOf(user_id) > -1 ){
                    entity.is_buy = 1;
                    entity.links_download = 'https://ebook-1310.appspot.com/libs/books/books-'+id+'.zip';
                }
                else {
                    entity.is_buy = 0;
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
            callback(null, entities);
        });
    }
}
snack2.ChapterDetailBookID = function(id, callback){
   getModel().DbChapterDetailByID(id, 10, true, function(err, entities, cursor){
       if (err) {
           return callback(err);
       }
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
snack.Chapters = function(book_id, user_id, callback) {
    snack.BookDetailts(book_id, user_id, function(err, result) {
        var chapter_ids = result.chapter_id.split(',');
        var chapters = {
            items:'',
            nextPageToken:false
        }
        snack2.ChapterDetailBookID(book_id,function(err, chapterResult) {
            if (err) {
                return callback(err);
            }
            chapters.items = chapterResult;
            result.chapter_id = chapters;
                callback(null, result);
        });

    });
}
snack2.ListQuiz = function(chapteritem, callback) {
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

snack.quizs = function(book_id, user_id, callback) {
    snack.Chapters(book_id, user_id, function(err, result) {
         async.map(result.chapter_id.items,snack2.ListQuiz, function (err, quizsReslt) {
             callback(null, result);
          });

    });
}

var myboooks = {};
myboooks.GetOrderByUserID = function(user_id,token,callback) {

    getModel().DbGetBooksOrderbyId(user_id,10, token, function (err, entities, cursor) {
        if (err) {
            return next(err);
        }
         var mybooks= {
            items: entities,
            nextPageToken: cursor
        };
        console.log('=============DbGetBooksOrderbyId=============');
        console.log(entities);
        callback(null,mybooks)
    });
}

myboooks.ApiRun = function(req,callback){

    myboooks.GetOrderByUserID(req.user_id,req.token,function(err,mybooks){
        console.log('=============RESULT=============');
        console.log(mybooks);
        callback(null,mybooks);
    });
}
/*=====================================MY BOOK====================================*/
/**
 * GET /api/books
 *
 * Retrieve a page of books (up to ten at a time).
 */

router.get('/', function list (req, res, next) {
    var user_id = req.query.user_id;
    var token = (req.query.nextPageToken) ? req.query.nextPageToken : false;
    var request = {
        'limit':10,
        'user_id':user_id,
        'token':token
    };

    getModel().DbGetBooksOrderbyId(request, function (err, entities, cursor) {
        if (err) {
            return next(err);
        }
        var mybooks= {
            items: entities,
            nextPageToken: cursor
        };

        res.json(mybooks);
    });
});

/*====================================GET BOOKS DETAIL=================================*/
router.get('/:book', function get (req, res, next) {
    var user_id = req.query.user_id;
    var book_id = req.params.book;
    snack.quizs(book_id, user_id, function(err, result) {
        if(err){
            console.log(err);
        }else {
            res.json(result);
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
