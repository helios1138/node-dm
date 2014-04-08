'use strict';

/**
 * @param {DM} dm
 * @param {string} name
 * @constructor
 */
function Resource(dm, name) {
  this._dm = dm;

  this._name = name;
  this._state = null;
  this._dependencies = [];
}

/**
 * @param {string|string[]} dependencies
 * @param {function} [callback]
 * @returns {Resource}
 */
Resource.prototype.depends = function (dependencies, callback) {
  var self = this;

  this._dependencies = dependencies;

  if (typeof callback === 'function') {
    this._dm.get(this._dependencies, function () {
      var result = callback.apply(null, Array.prototype.slice.call(arguments));

      if (result !== undefined) {
        self._dm.set(self._getFullName(), result);
      }
    });
  }

  return this;
};

/**
 * @param {*} value
 * @returns {Resource}
 */
Resource.prototype.provide = function (value) {
  var self = this;

  this._dm.get(this._dependencies, function () {
    self._dm.set(self._getFullName(), value);
  });

  return this;
};

/**
 * @param {string} state
 * @returns {Resource}
 */
Resource.prototype.setState = function (state) {
  var self = this;

  setTimeout(function () {
    self._state = state;

    self._dm.get(self._name, function (resource) {
      self._dm.set(self._getFullName(), resource);
    });
  }, 0);

  return this;
};

/**
 * @returns {string}
 * @private
 */
Resource.prototype._getFullName = function () {
  var name = [this._name];

  if (this._state !== null) {
    name.push(this._state);
  }

  return name.join(':');
};

module.exports = Resource;