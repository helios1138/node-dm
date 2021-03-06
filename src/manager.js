'use strict';

global.Promise = global.Promise || require('promise');

/**
 * @param {Container} container
 * @class
 */
function Manager(container) {
  this._container = container;
  this._config = {
    dependencyTimeout: 2500
  };
}

/**
 * @param {Object} config
 */
Manager.prototype.config = function (config) {
  for (var i in config) {
    if (config.hasOwnProperty(i)) {
      this._config[i] = config[i];
    }
  }
};

/**
 * @param {string} name
 * @param {string} type
 * @param {*} value
 * @param {string[]} dependencyNames
 * @returns {Manager}
 */
Manager.prototype.provide = function (name, type, value, dependencyNames) {
  this._container.get(name).provide(type, value, dependencyNames);
  return this;
};

/**
 * @param {string} name
 * @param {Function} constructor
 * @param {string[]} [dependencyNames]
 * @returns {Manager}
 */
Manager.prototype.class = function (name, constructor, dependencyNames) {
  if (dependencyNames === undefined) {
    dependencyNames = constructor.$depends;
  }

  this.provide(name, 'class', constructor, dependencyNames);
  return this;
};

/**
 * @param {string} name
 * @param {Function} factory
 * @param {string[]} [dependencyNames]
 * @returns {Manager}
 */
Manager.prototype.factory = function (name, factory, dependencyNames) {
  if (dependencyNames === undefined) {
    dependencyNames = factory.$depends;
  }

  this.provide(name, 'factory', factory, dependencyNames);
  return this;
};

/**
 * @param {string} name
 * @param {*} value
 * @returns {Manager}
 */
Manager.prototype.value = function (name, value) {
  this.provide(name, 'value', value, []);
  return this;
};

/**
 * @param {Array|Object} dependencyNames
 * @returns {Promise}
 */
Manager.prototype.resolve = function (dependencyNames) {
  if (!this._config.dependencyTimeout) {
    return this._container.resolve(dependencyNames);
  }
  else {
    return new Promise(function (resolve, reject) {
      this._container.resolve(dependencyNames).then(resolve, reject);

      setTimeout(
        function () {
          var unresolvedNames = this._container
            .getAll()
            .filter(function (dependency) { return !dependency.isResolved(); })
            .map(function (dependency) { return dependency.getName(); });

          if (unresolvedNames.length === 1) {
            reject(new Error(
              'Dependency "' +
              unresolvedNames[0] +
              '" was not resolved in ' +
              this._config.dependencyTimeout +
              'ms'
            ));
          }
          else if (unresolvedNames.length > 1) {
            unresolvedNames = unresolvedNames.map(function (name) { return '"' + name + '"'; });
            reject(new Error(
              'Dependencies "' +
              unresolvedNames.join(', ') +
              '" were not resolved in ' +
              this._config.dependencyTimeout +
              'ms'
            ));
          }
        }.bind(this),
        this._config.dependencyTimeout
      );
    }.bind(this));
  }
};

/**
 * @param {string} dependencyName
 * @returns {Promise}
 */
Manager.prototype.run = function (dependencyName) {
  return this.resolve([dependencyName]);
};

/**
 * @param {...string} dependencyNames
 * @returns {object}
 */
Manager.prototype.object = function (dependencyNames) {
  var obj = {};

  Array.prototype.slice.call(arguments).forEach(function (key) {
    obj[key] = true;
  });

  return obj;
};

module.exports = Manager;