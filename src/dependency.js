'use strict';

function Dependency(dm) {
  this._dm = dm;
  this._type = null;
  this._dependencyNames = [];
  this._resolve = null;
  this._promise = new Promise(function (resolve) { this._resolve = resolve; }.bind(this));
  this._isInstantiated = false;
}

Dependency.prototype.provide = function (type, value) {
  this._type = type;

  if (type !== 'value' && value.$depends) {
    this._dependencyNames = value.$depends;
  }

  this._resolve(value);
};

Dependency.prototype.getPromise = function () {
  if (!this._isInstantiated) {
    if (this._needsInstantiation()) {
      this._instantiatePromise();
    }

    this._isInstantiated = true;
  }

  return this._promise;
};

Dependency.prototype._needsInstantiation = function () {
  return this._type !== 'value';
};

Dependency.prototype._instantiatePromise = function () {
  this._promise = this._promise
    .then(function (value) {
      return Promise.all([value, this._dm.resolve(this._dependencyNames)]);
    }.bind(this))
    .then(function (result) {return this._instantiate(result[0], result[1]);}.bind(this));
};

Dependency.prototype._instantiate = function (source, dependencies) {
  var object;

  if (this._type === 'class') {
    object = this._instantiateFromClass(source, dependencies);
  }
  else if (this._type === 'factory') {
    object = this._instantiateFromFactory(source, dependencies);
  }

  return object;
};

Dependency.prototype._instantiateFromClass = function (constructor, dependencies) {
  function F() {
    return Array.isArray(this._dependencyNames) ?
      constructor.apply(this, dependencies) :
      constructor.call(this, dependencies);
  }

  F.prototype = constructor.prototype;

  return new F();
};

Dependency.prototype._instantiateFromFactory = function (factory, dependencies) {
  return Array.isArray(this._dependencyNames) ?
    factory.apply(null, dependencies) :
    factory.call(null, dependencies);
};

module.exports = { Dependency: Dependency };