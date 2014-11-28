'use strict';

var Promise = require('bluebird');

function Dependency(resolved, value) {
  this._resolved = resolved;
  this._value = value;
  this._promise = null;

  this._createPromise();
}

Dependency.prototype.resolve = function (value) {
  this._resolve(value);
  this._resolved = true;
};

Dependency.prototype.isResolved = function () {
  return this._resolved;
};

Dependency.prototype.getPromise = function () {
  return this._promise;
};

Dependency.prototype._createPromise = function () {
  if (this.isResolved()) {
    this._promise = Promise.resolve(this._value);
  }
  else {
    this._promise = new Promise(function (resolve) {
      this._resolve = resolve;
    }.bind(this));
  }
};

module.exports = Dependency;