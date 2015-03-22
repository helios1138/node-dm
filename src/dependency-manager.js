'use strict';

var Dependency = require('./dependency').Dependency;

function DependencyManager() {
  this._dependencies = {};
}

DependencyManager.prototype.set = function (name, type, value) {
  if (typeof this._dependencies[name] === 'undefined') {
    this._dependencies[name] = new Dependency(this);
  }

  this._dependencies[name].provide(type, value);
};

DependencyManager.prototype.get = function (name) {
  if (typeof this._dependencies[name] === 'undefined') {
    this._dependencies[name] = new Dependency(this);
  }

  return this._dependencies[name];
};

DependencyManager.prototype.resolve = function (dependencyNames) {
  return Array.isArray(dependencyNames) ?
    this._resolveAsArray(dependencyNames) :
    this._resolveAsObject(dependencyNames);
};

DependencyManager.prototype._resolveAsArray = function (dependencyNames) {
  return Promise
    .all(dependencyNames
      .map(function (name) {return this.get(name).getPromise();}.bind(this)
    ));
};

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

module.exports = { DependencyManager: DependencyManager };