'use strict';

var Promise    = require('bluebird'),
    Dependency = require('./dependency');

function DependencyManager() {
  this._dependenices = {};
}

DependencyManager._construct = function (constructor, args) {
  function F() {
    return constructor.apply(this, args);
  }

  F.prototype = constructor.prototype;
  return new F();
};

DependencyManager.prototype.set = function (name, value) {
  if (typeof this._dependenices[name] === 'undefined') {
    this._dependenices[name] = new Dependency(true, value);
  }
  else if (!this._dependenices[name].isResolved()) {
    this._dependenices[name].resolve(value);
  }
  else {
    throw new Error('Dependency "' + name + '" has already been provided');
  }
};

DependencyManager.prototype.get = function (names, cb) {
  if (names instanceof Array) {
    return this.getAsArray(names, cb);
  }
  else {
    return this.getAsObject(Object.keys(names), cb);
  }
};

DependencyManager.prototype.getAsArray = function (names, cb) {
  var promise = Promise.all(names.map(function (name) {
    if (typeof this._dependenices[name] === 'undefined') {
      this._dependenices[name] = new Dependency();
    }

    return this._dependenices[name].getPromise();
  }, this));

  if (typeof cb === 'function') {
    promise.then(cb);
  }

  return promise;
};

DependencyManager.prototype.getAsObject = function (names, cb) {
  var promise = this
    .getAsArray(names)
    .then(function (dependenices) {
      var object = {};

      dependenices.forEach(function (dependency, i) {
        object[names[i]] = dependency;
      });

      return object;
    });

  if (typeof cb === 'function') {
    promise.then(cb);
  }

  return promise;
};

DependencyManager.prototype.provide = function (name, source) {
  var exported;

  if (source === undefined) {
    exported = {};

    for (var i in arguments[0]) {
      if (arguments[0].hasOwnProperty(i)) {
        exported[i] = this.provide(i, arguments[0][i]);
      }
    }
  }
  else {
    var type = source[0],
        value = source[1],
        depends = source[2];

    exported = value;

    if (type === 'value') {
      this.set(name, value);
    }
    else if (type === 'type' || type === 'class') {
      depends = depends || value.$depends;

      if (!depends) {
        this.set(name, new value());
      }
      else {
        this.get(depends, function (dependencies) {
          this.set(
            name,
            (dependencies instanceof Array) ?
              DependencyManager._construct(value, dependencies) :
              new value(dependencies)
          );
        }.bind(this));
      }
    }
    else if (type === 'factory') {
      depends = depends || value.$depends;

      if (!depends) {
        this.set(name, value());
      }
      else {
        this.get(depends, function (dependencies) {
          this.set(
            name,
            (dependencies instanceof Array) ?
              value.apply(null, dependencies) :
              value.call(null, dependencies)
          );
        }.bind(this));
      }
    }
  }

  return exported;
};

module.exports = DependencyManager;