'use strict';

global.Promise = global.Promise || require('promise');

var Container = require('./container').Container;

/**
 * @class
 */
function Manager() {
  this._container = new Container();
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
 * @returns {Manager}
 */
Manager.prototype.provide = function (name, type, value) {
  this._container.get(name).provide(type, value);
  return this;
};

/**
 * @param {string} name
 * @param {Function} constructor
 * @returns {Manager}
 */
Manager.prototype.class = function (name, constructor) {
  this.provide(name, 'class', constructor);
  return this;
};

/**
 * @param {string} name
 * @param {Function} factory
 * @returns {Manager}
 */
Manager.prototype.factory = function (name, factory) {
  this.provide(name, 'factory', factory);
  return this;
};

/**
 * @param {string} name
 * @param {*} value
 * @returns {Manager}
 */
Manager.prototype.value = function (name, value) {
  this.provide(name, 'value', value);
  return this;
};

/**
 * @param {Array|Object} dependencyNames
 * @returns {Promise}
 */
Manager.prototype.resolve = function (dependencyNames) {
  return this._container.resolve(dependencyNames);
};

/**
 * @param {string} dependencyName
 * @returns {Promise}
 */
Manager.prototype.run = function (dependencyName) {
  return this.resolve([dependencyName]);
};

module.exports = { Manager: Manager };