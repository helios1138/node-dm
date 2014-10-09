'use strict';

var
  q = require('q'),
  Resource = require('./resource'),
  createDependencyStrategy = require('./dependency-strategy');

/**
 * @constructor
 */
function DM() {
  this._dependencies = {};
  this._subscribers = [];
  this._resources = {};

  this._timeout = null;
}

DM.TIMEOUT = 3000;

/**
 * @param {string} name
 * @param {*} value
 */
DM.prototype.set = function (name, value) {
  if (typeof this._dependencies[name] !== 'undefined') {
    throw new Error('Dependency "' + name + '" has already been provided');
  }

  this._dependencies[name] = value;

  this._resolve();
};

/**
 * @param {string|string[]} dependencies
 * @param {function} [callback]
 * @returns {Promise}
 */
DM.prototype.get = function (dependencies, callback) {
  var deferred = q.defer();

  this._subscribers.push({
    dependencyStrategy: createDependencyStrategy(dependencies),
    callback: callback,
    deferred: deferred
  });

  this._resolve();

  return deferred.promise;
};

/**
 * @param {string} dependency
 * @returns {boolean}
 */
DM.prototype.isResolved = function (dependency) {
  return (typeof this._dependencies[dependency] !== 'undefined');
};

/**
 * @private
 */
DM.prototype._areAllResolved = function (dependencies) {
  // Implemented in the fastest possible way.
  var length = dependencies.length;
  for (var i = 0; i < length; i++) {
    if (!this.isResolved(dependencies[i]))
    {
      return false;
    }
  }
  return true;
};

/**
 * @param {string} name
 * @param callback
 * @returns {Resource}
 */
DM.prototype.resource = function (name, callback) {
  if (typeof this._resources[name] === 'undefined') {
    this._resources[name] = new Resource(this, name);
  }

  if (typeof callback === 'function') {
    this._resources[name].provide(callback());
  }

  return this._resources[name];
};

/**
 * @param {string} name
 */
DM.prototype.getResource = function (name) {
  return this._resources[name];
};

/**
 * @private
 */
DM.prototype._resolve = function () {
  var
    self = this,
    remainingSubscribers = [],
    toCall = [];

  this._subscribers.forEach(function (subscriber) {
    if (!self._areAllResolved(subscriber.dependencyStrategy.requiredDependencies)) {
      remainingSubscribers.push(subscriber);
    }
    else {
      var returnedValue = subscriber.dependencyStrategy.buildReturningValue(self._dependencies);

      toCall.push(function () {
        if (subscriber.callback) {
          subscriber.callback.apply(null, Array.isArray(returnedValue) ? returnedValue : [returnedValue]);
        }
        subscriber.deferred.resolve(returnedValue);
      });
    }
  });

  this._subscribers = remainingSubscribers;

  toCall.forEach(function (callback) {
    callback();
  });

  this._delayReporting();
};

DM.prototype._delayReporting = function () {
  if (this._timeout !== null) {
    clearTimeout(this._timeout);
  }

  this._timeout = setTimeout(this._reportMissing.bind(this), DM.TIMEOUT);
};

DM.prototype._printLog = console.log;

DM.prototype._reportMissing = function () {
  function isEmpty(obj) {
    if (obj == null) return true;
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) return false;
    }

    return true;
  }

  var
    resource,
    missingByResource = {},
    missingGeneral = {},
    key,
    isResolved = this.isResolved.bind(this),
    causeOfTheProblem = {};

  var checkResourceDependencies = function checkResourceDependencies(resource, dependency) {
    if (!isResolved(dependency)) {
      missingByResource[resource._name] = missingByResource[resource._name] || [];
      missingByResource[resource._name].push(dependency);
    }
  };

  for (key in this._resources) {
    if (this._resources.hasOwnProperty(key)) {
      resource = this._resources[key];
      resource._dependencies.forEach(checkResourceDependencies.bind(this, resource));
    }
  }

  // Trying to find the main problematic dependency.
  for (key in missingByResource) {
    if (missingByResource.hasOwnProperty(key)) {
      missingByResource[key].forEach(function (dependant) {
        if (typeof missingByResource[dependant] === 'undefined') {
          causeOfTheProblem[dependant] = true;
        }
      });
    }
  }

  this._subscribers.forEach(function (subscriber) {
    subscriber.dependencyStrategy.requiredDependencies.forEach(function (dependency) {
      if (!isResolved(dependency)) {
        missingGeneral[dependency] = true;
      }
    });
  });

  if (!isEmpty(causeOfTheProblem)) {
    this._printLog('Main dependency missing: ' + Object.keys(causeOfTheProblem).join(', '));
  }

  if (!isEmpty(missingGeneral)) {
    this._printLog('Final list of missing dependencies: [ ' + Object.keys(missingGeneral).join(', ') + ' ]');
  }
};

module.exports = DM;
