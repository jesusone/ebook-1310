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

var gcloud = require('gcloud');
var config = require('../config');
// [START config]
var ds = gcloud.datastore({
  projectId: config.get('GCLOUD_PROJECT')
});

var kind = 'users';
// [END config]

// Translates from Datastore's entity format to
// the format expected by the application.
//
// Datastore format:
//   {
//     key: [kind, id],
//     data: {
//       property: value
//     }
//   }
//
// Application format:
//   {
//     id: id,
//     property: value
//   }
function fromDatastore (obj) {
  obj.data.id = obj.key.id;
  return obj.data;
}

// Translates from the application's format to the datastore's
// extended entity property format. It also handles marking any
// specified properties as non-indexed. Does not translate the key.
//
// Application format:
//   {
//     id: id,
//     property: value,
//     unindexedProperty: value
//   }
//
// Datastore extended format:
//   [
//     {
//       name: property,
//       value: value
//     },
//     {
//       name: unindexedProperty,
//       value: value,
//       excludeFromIndexes: true
//     }
//   ]
function toDatastore (obj, nonIndexed) {
  nonIndexed = nonIndexed || [];
  var results = [];
  Object.keys(obj).forEach(function (k) {
    if (obj[k] === undefined) {
      return;
    }
    results.push({
      name: k,
      value: obj[k],
      excludeFromIndexes: nonIndexed.indexOf(k) !== -1
    });
  });
  return results;
}

// Lists all books in the Datastore sorted alphabetically by title.
// The ``limit`` argument determines the maximum amount of results to
// return per page. The ``token`` argument allows requesting additional
// pages. The callback is invoked with ``(err, books, nextPageToken)``.
// [START list]
function list (limit, token, cb) {
  var q = ds.createQuery([kind])
    .limit(limit)
    .order('name')
    .start(token);

  ds.runQuery(q, function (err, entities, nextQuery) {
    if (err) {
      return cb(err);
    }
    var hasMore = entities.length === limit ? nextQuery.startVal : false;
    cb(null, entities.map(fromDatastore), hasMore);
  });
}
// [END list]
// [START list]
function list_roles (limit, token, cb) {
  var q = ds.createQuery(['roles'])
    .limit(limit)
    .order('type')
    .start(token);

  ds.runQuery(q, function (err, entities, nextQuery) {
    if (err) {
      return cb(err);
    }
    var hasMore = entities.length === limit ? nextQuery.startVal : false;
    cb(null, entities.map(fromDatastore), hasMore);
  });
}
function CheckSoialID (id,  cb) {
  console.log(typeof id);
  var q = ds.createQuery([kind])
    .filter('social_id', '=' , id)
    .limit(1)


  ds.runQuery(q, function (err, entities, nextQuery) {
    if (err) {
      return cb(err);
    }
    cb(null, entities.map(fromDatastore));
  });
}
// [END list]

// Creates a new book or updates an existing book with new data. The provided
// data is automatically translated into Datastore format. The book will be
// queued for background processing.
// [START update]
function update (id, data, cb) {
  var key;
  if (id) {
    key = ds.key([kind, parseInt(id, 10)]);
  } else {
    key = ds.key(kind);
  }

  var entity = {
    key: key,
    data: toDatastore(data, ['description'])
  };

  ds.save(
    entity,
    function (err) {
      data.id = entity.key.id;
      cb(err, err ? null : data);
    }
  );
}
// [END update]
// [START update]
function update_roles (id, data, cb) {
  var key;
  if (id) {
    key = ds.key(['roles', parseInt(id, 10)]);
  } else {
    key = ds.key('roles');
  }

  var entity = {
    key: key,
    data: toDatastore(data, ['description'])
  };

  ds.save(
    entity,
    function (err) {
      data.id = entity.key.id;
      cb(err, err ? null : data);
    }
  );
}
// [END update]

function read (id, cb) {
  var key = ds.key([kind, parseInt(id, 10)]);
  ds.get(key, function (err, entity) {
    if (err) {
      return cb(err);
    }
    if (!entity) {
      return cb({
        code: 404,
        message: 'Not found'
      });
    }
    cb(null, fromDatastore(entity));
  });
}

function _delete (id, cb) {
  var key = ds.key([kind, parseInt(id, 10)]);
  ds.delete(key, cb);
}

// [START exports]
module.exports = {
  create: function (data, cb) {
    update(null, data, cb);
  },
  create_roles: function (data, cb) {
    update_roles(null, data, cb);
  },
  read: read,
  update: update,
  delete: _delete,
  list_roles: list_roles,
  CheckSoialID: CheckSoialID,
  list: list
};
// [END exports]
