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
    if (!this.isResolved(dependencies[i])) {
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

  // Loop through all non resolved subscribers.
  this._subscribers.forEach(function (subscriber) {
    var strategy = subscriber.dependencyStrategy; // This variable is a speedup hack
    var isResolved = strategy.requiredDependencies.every(self.isResolved.bind(self));

    if (isResolved) {
      toCall.push(function () {
        var returningValue = strategy.buildReturningValue(self._dependencies);
        if (subscriber.callback)
        {
          strategy.invokeCallback(subscriber.callback, returningValue);
        }

        subscriber.deferred.resolve(returningValue);
      });
    }
    else {
      remainingSubscribers.push(subscriber);
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

/**
 * Build an object with missing resources.
 * @returns {{}} Object. Keys are missing resources. Values are arrays of missing deps.
 * @private
 */
DM.prototype._getMissingByResource = function () {
  var resource, key, missingByResource = {};

  var checkResourceDependencies = function checkResourceDependencies(resourceName, dependency) {
    if (!this.isResolved(dependency)) {
      missingByResource[resourceName] = missingByResource[resourceName] || [];
      missingByResource[resourceName].push(dependency);
    }
  };

  for (key in this._resources) {
    if (this._resources.hasOwnProperty(key)) {
      resource = this._resources[key];
      resource._dependencies.forEach(checkResourceDependencies.bind(this, resource._name));
    }
  }

  return missingByResource;
};

DM.prototype._getMainMissingDependencies = function () {
  var
    key,
    missingByResource = this._getMissingByResource(),
    causeOfTheProblem = {},
    stringMessages = [];

  // Trying to find the main problematic dependency.
  for (key in missingByResource) {
    if (missingByResource.hasOwnProperty(key)) {
      missingByResource[key].forEach(function (resourceAndState) {
        resourceAndState = resourceAndState.split(':');
        var res = resourceAndState[0];
        var state = resourceAndState[1];
        if (typeof missingByResource[res] === 'undefined') {
          causeOfTheProblem[res] = state || true;
        }
      });
    }
  }

  for (key in causeOfTheProblem) {
    if (causeOfTheProblem.hasOwnProperty(key)) {
      var str = key;
      if (causeOfTheProblem[key] !== true) {
        str += ':' + causeOfTheProblem[key];
      }
      stringMessages.push(str);
    }
  }

  return stringMessages.join(', ');
};

DM.prototype._getGeneralMissingDependencies = function () {  var
  missingGeneral = {},
  isResolved = this.isResolved.bind(this);

  this._subscribers.forEach(function (subscriber) {
    subscriber.dependencyStrategy.requiredDependencies.forEach(function (dependency) {
      if (!isResolved(dependency)) {
        missingGeneral[dependency] = true;
      }
    });
  });

  return Object.keys(missingGeneral).join(', ');
};

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
    missingGeneral = this._getGeneralMissingDependencies(),
    causeOfTheProblem = this._getMainMissingDependencies();

  if (!isEmpty(causeOfTheProblem)) {
    this._printLog('Main dependency missing: ' + causeOfTheProblem);
  }

  if (!isEmpty(missingGeneral)) {
    this._printLog('Final list of missing dependencies: [ ' + missingGeneral + ' ]');
  }
};

module.exports = DM;
