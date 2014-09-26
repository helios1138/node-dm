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
  var requestedSingle = false;

  if (!Array.isArray(dependencies)) {
    dependencies = [dependencies];
    requestedSingle = true;
  }

  this._subscribers.push({
    dependencies: dependencies,
    callback: callback,
    deferred: deferred,
    requestedSingle: requestedSingle
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
    provided = Object.keys(this._dependencies),
    remainingSubscribers = [],
    toCall = [];

  this._subscribers.forEach(function (subscriber) {
    var
      isResolved = true,
      dependencies = [];

    subscriber.dependencies.forEach(function (dependencyName) {
      if (provided.indexOf(dependencyName) === -1) {
        isResolved = false;
      }
      else {
        dependencies.push(self._dependencies[dependencyName]);
      }
    });

    if (isResolved) {
      toCall.push(function () {
        if (subscriber.callback) {
          subscriber.callback.apply(null, dependencies);
        }
        if (subscriber.requestedSingle) {
          subscriber.deferred.resolve(dependencies[0]);
        }
        else {
          subscriber.deferred.resolve(dependencies);
        }
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

DM.prototype._reportMissing = function () {
  var
    resource,
    missingByResource = {},
    missingGeneral = {},
    key,
    isResolved = this.isResolved.bind(this),
    causeOfTheProblem = [];

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
          causeOfTheProblem.push(dependant);
        }
      });
    }
  }

  this._subscribers.forEach(function (subscriber) {
    subscriber.dependencies.forEach(function (dependency) {
      if (Object.keys(this._dependencies).indexOf(dependency) === -1) {
        missingGeneral[dependency] = true;
      }
    }, this);
  }, this);

  if (causeOfTheProblem.length) {
    this._printLog('Main dependency missing: ' + causeOfTheProblem.join(', '));
  }

  if (Object.keys(missingGeneral).length > 0) {
    this._printLog('Final list of missing dependencies: [ ' + Object.keys(missingGeneral).join(', ') + ' ]');
  }
};

module.exports = DM;