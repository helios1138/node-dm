'use strict';

global.Promise = global.Promise || require('promise');

/**
 * @param {Container} container
 * @param {string} name
 * @class
 */
function Dependency(container, name) {
  this._container = container;
  this._name = name;

  this._type = null;
  this._depends = [];

  this._resolve = null;
  this._isResolved = false;

  this._sourcePromise = new Promise(function (resolve) { this._resolve = resolve; }.bind(this));
  this._instantiatedPromise = null;
}

/**
 * @param {string} type
 * @param {*|{ $depends: Array|Object }} value
 * @param {string[]} dependencyNames
 */
Dependency.prototype.provide = function (type, value, dependencyNames) {
  if (this._isResolved) {
    throw new Error('Dependency "' + this._name + '" was already provided');
  }

  this._isResolved = true;

  this._type = type;

  if (type !== 'value' && dependencyNames) {
    this._depends = dependencyNames;
  }

  this._resolve(value);
};

/**
 * @returns {string}
 */
Dependency.prototype.getName = function () {
  return this._name;
};

/**
 * @returns {Promise}
 */
Dependency.prototype.resolve = function () {
  if (!this._instantiatedPromise) {
    this._instantiatedPromise = this._getInstantiatedPromise();
  }

  return this._instantiatedPromise;
};

/**
 * @returns {Promise}
 */
Dependency.prototype.getSourcePromise = function () {
  return this._sourcePromise;
};

/**
 * @returns {string[]}
 */
Dependency.prototype.getDependencyNames = function () {
  return Array.isArray(this._depends) ? this._depends : Object.keys(this._depends);
};

/**
 * @returns {Promise}
 */
Dependency.prototype.getDependencies = function () {
  return Promise.all(
    this.getDependencyNames().map(function (name) {
      var dependency = this._container.get(name);
      return dependency
        .getSourcePromise()
        .then(function () { return dependency; });
    }.bind(this))
  );
};

/**
 * @returns {boolean}
 */
Dependency.prototype.isResolved = function () {
  return this._isResolved;
};

/**
 * @returns {Promise}
 * @private
 */
Dependency.prototype._getInstantiatedPromise = function () {
  return Promise
    .all([
      this._sourcePromise,
      this._checkForCircularDependencies()
    ])
    .then(function (result) {
      return Promise.all([result[0], this._container.resolve(this._depends)]);
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
};

/**
 * @param {Function} constructor
 * @param {Array|Object} dependencies
 * @returns {Object}
 * @private
 */
Dependency.prototype._instantiateFromClass = function (constructor, dependencies) {
  var dependencyNames = this._depends;

  var F = Array.isArray(dependencyNames) ?
    constructor.bind.apply(constructor, [null].concat(dependencies)) :
    constructor.bind(null, dependencies);

  return new F();
};

/**
 * @param {Function} factory
 * @param {Array|Object} dependencies
 * @returns {*}
 * @private
 */
Dependency.prototype._instantiateFromFactory = function (factory, dependencies) {
  return Array.isArray(this._depends) ?
    factory.apply(null, dependencies) :
    factory.call(null, dependencies);
};

/**
 * @returns {Promise}
 * @private
 */
Dependency.prototype._checkForCircularDependencies = function () {
  var link           = [this.getName()],
      alreadyChecked = [];

  function checkIfDependencyIsSelf(dependency, subDependencies) {
    return Promise.all(subDependencies.map(function (subDependency) {
      link.push(subDependency.getName());

      if (alreadyChecked.indexOf(subDependency) >= 0) {
        return;
      }

      alreadyChecked.push(subDependency);

      if (subDependency === dependency) {
        throw new Error(
          'Circular dependency found: ' +
          link
            .map(function (part) { return '"' + part + '"'; })
            .join(' < ')
        );
      }
      else {
        return checkThirdLevelDependencies(dependency, subDependency);
      }
    }));
  }

  function checkThirdLevelDependencies(dependency, subDependency) {
    return subDependency
      .getDependencies()
      .then(function (subDependencies) {
        return checkIfDependencyIsSelf(dependency, subDependencies);
      });
  }

  return checkThirdLevelDependencies(this, this);
};

module.exports = Dependency;