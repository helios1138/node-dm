'use strict';

global.Promise = global.Promise || require('promise');

/**
 * @param {DependencyManager} dm
 * @constructor
 */
function Dependency(dm) {
  this._dm = dm;
  this._type = null;
  this._dependencyNames = [];
  this._resolve = null;
  this._promise = new Promise(function (resolve) { this._resolve = resolve; }.bind(this));
  this._isInstantiated = false;
}

/**
 * @param {string} type
 * @param {*|{ $depends: Array|Object }} value
 */
Dependency.prototype.provide = function (type, value) {
  this._type = type;

  if (type !== 'value' && value.$depends) {
    this._dependencyNames = value.$depends;
  }

  this._resolve(value);
};

/**
 * @returns {Promise}
 */
Dependency.prototype.getPromise = function () {
  if (!this._isInstantiated) {
    this._instantiatePromise();
    this._isInstantiated = true;
  }

  return this._promise;
};

/**
 * @private
 */
Dependency.prototype._instantiatePromise = function () {
  this._promise = this._promise
    .then(function (value) {
      return Promise.all([value, this._dm.resolve(this._dependencyNames)]);
    }.bind(this))
    .then(function (result) { return this._instantiate(result[0], result[1]); }.bind(this));
};

/**
 * @param {*} source
 * @param {Array|Object} dependencies
 * @returns {*}
 * @private
 */
Dependency.prototype._instantiate = function (source, dependencies) {
  if (this._type === 'value') {
    return source;
  }
  else if (this._type === 'class') {
    return this._instantiateFromClass(source, dependencies);
  }
  else if (this._type === 'factory') {
    return this._instantiateFromFactory(source, dependencies);
  }
  else if (this._type === 'asyncFactory') {
    return this._instantiateFromAsyncFactory(source, dependencies);
  }
};

/**
 * @param {Function} constructor
 * @param {Array|Object} dependencies
 * @returns {Object}
 * @private
 */
Dependency.prototype._instantiateFromClass = function (constructor, dependencies) {
  var dependencyNames = this._dependencyNames;

  function F() {
    return Array.isArray(dependencyNames) ?
      constructor.apply(this, dependencies) :
      constructor.call(this, dependencies);
  }

  F.prototype = constructor.prototype;

  return new F();
};

/**
 * @param {Function} factory
 * @param {Array|Object} dependencies
 * @returns {*}
 * @private
 */
Dependency.prototype._instantiateFromFactory = function (factory, dependencies) {
  return Array.isArray(this._dependencyNames) ?
    factory.apply(null, dependencies) :
    factory.call(null, dependencies);
};

/**
 * @param {Function} asyncFactory
 * @param {Array|Object} dependencies
 * @returns {*}
 * @private
 */
Dependency.prototype._instantiateFromAsyncFactory = function (asyncFactory, dependencies) {
  return new Promise(function (resolve) {
    Array.isArray(this._dependencyNames) ?
      asyncFactory.apply(null, dependencies.concat([resolve])) :
      asyncFactory.call(null, dependencies, resolve);
  }.bind(this));
};

module.exports = { Dependency: Dependency };