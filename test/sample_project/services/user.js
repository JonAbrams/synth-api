var Promise = require('bluebird');

exports.user = function (db, req) {
  return db.getUser(req.get('X-Username'));
};

exports.db = function () {
  return {
    getUser: Promise.method(function (val) {
      return val;
    })
  };
};
