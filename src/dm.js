'use strict';

var
  q = require('q'),
  Resource = require('./resource');

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
    dependencyStrategy: this._getDependencyStrategy(dependencies),
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
      var returnedObject = subscriber.dependencyStrategy.buildReturningObject(self._dependencies);

      toCall.push(function () {
        if (subscriber.callback) {
          subscriber.callback.apply(null, Array.isArray(returnedObject) ? returnedObject : [returnedObject]);
        }
        subscriber.deferred.resolve(returnedObject);
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

  if (causeOfTheProblem !== {}) {
    this._printLog('Main dependency missing: ' + Object.keys(missingGeneral).join(', '));
  }

  if (missingGeneral !== {}) {
    this._printLog('Final list of missing dependencies: [ ' + Object.keys(missingGeneral).join(', ') + ' ]');
  }
};

DM.prototype._getDependencyStrategy = function (dependencies) {
  function ArrayStrategy(dependencies) {
    this.requiredDependencies = dependencies;

    this.buildReturningObject = function buildReturningObject(allDependencies) {
      return this.requiredDependencies.map(function (dependencyName) {
        return allDependencies[dependencyName];
      });
    };
  }

  function StringStrategy(dependencies) {
    this.requiredDependencies = [dependencies];

    this.buildReturningObject = function buildReturningObject(allDependencies) {
      return allDependencies[this.requiredDependencies[0]];
    };
  }

  function ObjectStrategy(dependencies) {
    this.requiredDependencies = [];
    for (var key in dependencies) {
      if (dependencies.hasOwnProperty(key)) {
        var value = dependencies[key];
        this.requiredDependencies.push(key + (typeof value === 'string' ? (':' + value) : ''));
      }
    }

    this.buildReturningObject = function buildReturningObject(allDependencies) {
      var returnedObject = {};
      this.requiredDependencies.forEach(function (dependencyName) {
        returnedObject[Resource.parseName(dependencyName).resource] = allDependencies[dependencyName];
      });
      return returnedObject;
    };
  }

  if (Array.isArray(dependencies)) {
    return new ArrayStrategy(dependencies);
  }
  else if (typeof dependencies === 'string' || dependencies instanceof String) {
    return new StringStrategy(dependencies);
  }
  else if (typeof dependencies === 'object') {
    return new ObjectStrategy(dependencies);
  }
  else {
    throw new Error('Incorrect type of dependencies argument.')
  }
}

module.exports = DM;
