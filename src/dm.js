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

  if (!Array.isArray(dependencies)) {
    dependencies = [dependencies];
  }

  this._subscribers.push({
    dependencies: dependencies,
    callback:     callback,
    deferred:     deferred
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
        subscriber.deferred.resolve(dependencies);
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

DM.prototype._reportMissing = function () {
  var
    resource,
    missingByResource = {},
    missingGeneral = {},
    key;

  var checkResourceDependencies = function (resource, dependency) {
    if (typeof this._dependencies[dependency] === 'undefined') {
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

  this._subscribers.forEach(function (subscriber) {
    subscriber.dependencies.forEach(function (dependency) {
      if (Object.keys(this._dependencies).indexOf(dependency) === -1) {
        missingGeneral[dependency] = true;
      }
    }, this);
  }, this);

  for (key in missingByResource) {
    if (missingByResource.hasOwnProperty(key)) {
      console.log('Resource "' + key + '" still waiting for [ ' + missingByResource[key].join(', ') + ' ]');
    }
  }

  if (Object.keys(missingGeneral).length > 0) {
    console.log('Final list of missing dependencies: [ ' + Object.keys(missingGeneral).join(', ') + ' ]');
  }
};

module.exports = DM;