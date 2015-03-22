import {Dependency} from './dependency';

export class DependencyManager {
  constructor() {
    this._dependencies = {};
  }

  set(name, type, value) {
    if (typeof this._dependencies[name] === 'undefined') {
      this._dependencies[name] = new Dependency(this);
    }

    this._dependencies[name].provide(type, value);
  }

  get(name) {
    if (typeof this._dependencies[name] === 'undefined') {
      this._dependencies[name] = new Dependency(this);
    }

    return this._dependencies[name];
  }

  resolve(dependencyNames) {
    return Array.isArray(dependencyNames) ?
      this._resolveAsArray(dependencyNames) :
      this._resolveAsObject(dependencyNames);
  }

  _resolveAsArray(dependencyNames) {
    return Promise
      .all(dependencyNames
        .map((name) => this.get(name).getPromise()
      ));
  }

  _resolveAsObject(dependencyNames) {
    var names = Object.keys(dependencyNames);

    return this
      ._resolveAsArray(names)
      .then((dependencies) => {
        var obj = {};

        dependencies.forEach((dependency, i) => {
          obj[names[i]] = dependency;
        });

        return obj;
      });
  }
}