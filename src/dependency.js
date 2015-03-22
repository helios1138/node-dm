export class Dependency {
  constructor(dm) {
    this._dm = dm;
    this._type = null;
    this._dependencyNames = [];
    this._resolve = null;
    this._promise = new Promise((resolve) => { this._resolve = resolve; });
    this._isInstantiated = false;
  }

  provide(type, value) {
    this._type = type;

    if (type !== 'value' && value.$depends) {
      this._dependencyNames = value.$depends;
    }

    this._resolve(value);
  }

  getPromise() {
    if (!this._isInstantiated) {
      if (this._needsInstantiation()) {
        this._instantiatePromise();
      }

      this._isInstantiated = true;
    }

    return this._promise;
  }

  _needsInstantiation() {
    return this._type !== 'value';
  }

  _instantiatePromise() {
    this._promise = this._promise
      .then((value) => {
        return Promise.all([value, this._dm.resolve(this._dependencyNames)]);
      })
      .then((result) => this._instantiate(result[0], result[1]));
  }

  _instantiate(source, dependencies) {
    var object;

    if (this._type === 'class') {
      object = this._instantiateFromClass(source, dependencies);
    }
    else if (this._type === 'factory') {
      object = this._instantiateFromFactory(source, dependencies);
    }

    return object;
  }

  _instantiateFromClass(constructor, dependencies) {
    function F() {
      return Array.isArray(this._dependencyNames) ?
        constructor.apply(this, dependencies) :
        constructor.call(this, dependencies);
    }

    F.prototype = constructor.prototype;

    return new F();
  }

  _instantiateFromFactory(factory, dependencies) {
    return Array.isArray(this._dependencyNames) ?
      factory.apply(null, dependencies) :
      factory.call(null, dependencies);
  }
}