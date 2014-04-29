'use strict';

var q = require('q');

/**
 * @param {DM} dm
 * @param {string} name
 * @constructor
 */
function Resource(dm, name) {
  /**
   * @type {DM}
   * @private
   */
  this._dm = dm;

  /**
   * @type {string}
   * @private
   */
  this._name = name;

  /**
   * @type {string|null}
   * @private
   */
  this._state = null;

  /**
   * @type {string[]}
   * @private
   */
  this._dependencies = [];

  /**
   * @type {{ string: Promise }}
   * @private
   */
  this._delays = {};
}

Resource.parseName = function (name) {
  var parts = name.split(':');

  return {
    resource: parts[0],
    state: parts[1] || null
  };
};

/**
 * @param {string|string[]} dependencies
 * @param {function} [callback]
 * @returns {Resource}
 */
Resource.prototype.depends = function (dependencies, callback) {
  var self = this;

  if (!Array.isArray(dependencies)) {
    dependencies = [dependencies];
  }

  this._dependencies = dependencies;

  this._checkForCircularDependency(this._name);

  if (typeof callback === 'function') {
    this._dm.get(this._dependencies, function () {
      self._checkForOutdatedDependencyStates(dependencies);

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
 * @param {function} [callback]
 * @returns {Resource}
 */
Resource.prototype.setState = function (state, callback) {
  var self = this;

  function setDependency(resource) {
    self._state = state;

    return function () {
      self._dm.set(self._getFullName(), resource);

      if (typeof callback === 'function') {
        callback();
      }
    };
  }

  setTimeout(function () {

    self._dm.get(self._name, function (resource) {
      if (typeof self._delays[self.getState()] !== 'undefined' && self._delays[self.getState()].length > 0) {
        q.all(self._delays[self.getState()]).then(setDependency(resource));
      }
      else {
        setDependency(resource)();
      }
    });
  }, 0);

  return this;
};

/**
 * @returns {string}
 */
Resource.prototype.getState = function () {
  return this._state;
};

/**
 * @param {string} state
 * @returns {function}
 */
Resource.prototype.delay = function (state) {
  var deferred = q.defer();

  if (typeof this._delays[state] === 'undefined') {
    this._delays[state] = [];
  }

  this._delays[state].push(deferred.promise);

  return deferred.resolve;
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

/**
 * @param {string|string[]} dependencies
 * @private
 */
Resource.prototype._checkForOutdatedDependencyStates = function (dependencies) {
  var self = this;

  if (!Array.isArray(dependencies)) {
    dependencies = [dependencies];
  }

  dependencies.forEach(function (dependency) {
    var
      resourceName = Resource.parseName(dependency),
      resource = self._dm.getResource(resourceName[0]),
      resourceState;

    if (resource !== undefined) {
      resourceState = resource.getState();
      if (resourceState !== resourceName.state) {
        throw new Error('Resource "' + self._name + '" depends on "' + dependency + '" which is no longer available and replaced by "' + resourceName.resource + ':' + resourceState + '"');
      }
    }
  });
};

/**
 * @param {string} dependency
 * @returns {boolean}
 * @private
 */
Resource.prototype._checkForCircularDependency = function (dependency) {
  var
    self = this,
    conflictingDependencyIdx = this._dependencies.indexOf(dependency);

  if (conflictingDependencyIdx !== -1) {
    throw new Error('Circular dependency found: "' + dependency + '" <- "' + this._name + '"');
  }
  else {
    this._dependencies
      .map(function (dependency) {
        return self._dm.getResource(Resource.parseName(dependency).resource);
      })
      .filter(function (resource) {
        return (resource !== undefined);
      })
      .forEach(function (resource) {
        resource._checkForCircularDependency(dependency);
      });
  }
};

module.exports = Resource;