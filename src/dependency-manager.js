'use strict';

global.Promise = global.Promise || require('promise');

var Dependency = require('./dependency').Dependency;

/**
 * @constructor
 */
function DependencyManager() {
  /**
   * @type {Object.<string, Dependency>}
   * @private
   */
  this._dependencies = {};
  this._config = {
    dependencyTimeout: false,
    checkForCircular:  false
  };
}

/**
 * @param {Object} config
 */
DependencyManager.prototype.config = function (config) {
  for (var i in config) {
    if (config.hasOwnProperty(i)) {
      this._config[i] = config[i];
    }
  }
};

/**
 * @param {string} name
 * @param {string} type
 * @param {*} value
 * @returns {DependencyManager}
 */
DependencyManager.prototype.provide = function (name, type, value) {
  var dependency = this._getDependency(name);

  dependency.provide(type, value);

  if (this._config.checkForCircular) {
    this._checkForCircular(dependency);
  }

  return this;
};

/**
 * @param {string} name
 * @param {Function} constructor
 * @returns {DependencyManager}
 */
DependencyManager.prototype.class = function (name, constructor) {
  this.provide(name, 'class', constructor);
  return this;
};

/**
 * @param {string} name
 * @param {Function} factory
 * @returns {DependencyManager}
 */
DependencyManager.prototype.factory = function (name, factory) {
  this.provide(name, 'factory', factory);
  return this;
};

/**
 * @param {string} name
 * @param {*} value
 * @returns {DependencyManager}
 */
DependencyManager.prototype.value = function (name, value) {
  this.provide(name, 'value', value);
  return this;
};

/**
 * @param {string} dependencyName
 * @returns {Promise}
 */
DependencyManager.prototype.run = function (dependencyName) {
  return this.resolve([dependencyName]);
};

/**
 * @param {Array|Object} dependencyNames
 * @returns {Promise}
 */
DependencyManager.prototype.resolve = function (dependencyNames) {
  return Array.isArray(dependencyNames) ?
    this._resolveAsArray(dependencyNames) :
    this._resolveAsObject(dependencyNames);
};

/**
 * @param {string} name
 * @returns {Promise}
 * @private
 */
DependencyManager.prototype._resolveDependency = function (name) {
  var dependencyPromise = this._getDependency(name).getPromise(),
      dependencyTimeout = this._config.dependencyTimeout;

  if (dependencyTimeout) {
    return Promise.race([
      dependencyPromise,
      new Promise(function (resolve, reject) {
        setTimeout(
          function () {
            reject(new Error('Dependency "' + name + '" was not resolved in ' + dependencyTimeout + 'ms'));
          },
          dependencyTimeout
        );
      })
    ]);
  }
  else {
    return dependencyPromise;
  }
};

/**
 * @param {Array|Object} dependencyNames
 * @returns {Promise}
 * @private
 */
DependencyManager.prototype._resolveAsArray = function (dependencyNames) {
  return Promise.all(dependencyNames.map(this._resolveDependency.bind(this)));
};

/**
 * @param {Array|Object} dependencyNames
 * @returns {Promise}
 * @private
 */
DependencyManager.prototype._resolveAsObject = function (dependencyNames) {
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

/**
 * @param {string} name
 * @returns {Dependency}
 * @private
 */
DependencyManager.prototype._getDependency = function (name) {
  if (typeof this._dependencies[name] === 'undefined') {
    this._dependencies[name] = new Dependency(this);
  }

  return this._dependencies[name];
};

/**
 * @param {Dependency} dependency
 * @private
 */
DependencyManager.prototype._checkForCircular = function (dependency) {


  //Promise.all()


  console.log(dependency.getDependencyNames());
};

module.exports = { DependencyManager: DependencyManager };