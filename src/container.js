'use strict';

global.Promise = global.Promise || require('promise');

var Dependency = require('./dependency').Dependency;

/**
 * @class
 */
function Container() {
  /**
   * @type {Object.<string, Dependency>}
   * @private
   */
  this._dependencies = {};
}

/**
 * @param {string} name
 * @returns {Dependency}
 */
Container.prototype.get = function (name) {
  if (typeof this._dependencies[name] === 'undefined') {
    this._dependencies[name] = new Dependency(this, name);
  }

  return this._dependencies[name];
};

/**
 * @param {string[]|Object.<string, *>} dependencyNames
 * @returns {Promise}
 */
Container.prototype.resolve = function (dependencyNames) {
  return Array.isArray(dependencyNames) ?
    this._resolveAsArray(dependencyNames) :
    this._resolveAsObject(dependencyNames);
};

/**
 * @param {string} name
 * @returns {Promise}
 * @private
 */
Container.prototype._resolveDependency = function (name) {
  return this.get(name).getPromise();
};

/**
 * @param {string[]} dependencyNames
 * @returns {Promise}
 * @private
 */
Container.prototype._resolveAsArray = function (dependencyNames) {
  return Promise.all(dependencyNames.map(this._resolveDependency.bind(this)));
};

/**
 * @param {Object.<string, *>} dependencyNames
 * @returns {Promise}
 * @private
 */
Container.prototype._resolveAsObject = function (dependencyNames) {
  var names = Object.keys(dependencyNames);

  return this
    ._resolveAsArray(names)
    .then(function (dependencies) {
      var obj = {};

      dependencies.forEach(function (dependency, i) {
        obj[names[i]] = dependency;
      }.bind(this));

      return obj;
    }.bind(this));
};

module.exports = { Container: Container };