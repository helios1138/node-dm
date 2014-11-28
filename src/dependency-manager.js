'use strict';

var Promise    = require('bluebird'),
    Dependency = require('./dependency');

function DependencyManager() {
  this._dependenices = {};
}

DependencyManager.prototype.set = function (name, value) {
  if (typeof this._dependenices[name] === 'undefined') {
    this._dependenices[name] = new Dependency(true, value);
  }
  else if (!this._dependenices[name].isResolved()) {
    this._dependenices[name].resolve(value);
  }
  else {
    throw new Error('Dependency "' + name + '" has already been provided');
  }
};

DependencyManager.prototype.get = function (names, cb) {
  var promise = Promise.all(names.map(function (name) {
    if (typeof this._dependenices[name] === 'undefined') {
      this._dependenices[name] = new Dependency();
    }

    return this._dependenices[name].getPromise();
  }, this));

  promise.then(cb);

  return promise;
};

module.exports = DependencyManager;