'use strict';

var
  utils = require('./utils');

function ArrayStrategy(dependencies) {
  this.requiredDependencies = dependencies;

  this.buildReturningValue = function buildReturningValue(allDependencies) {
    var res = this.requiredDependencies.map(function (dependencyName) {
      return allDependencies[dependencyName];
    });
    return res;
  };

  this.invokeCallback = function invokeCallback(cb, val) {
    cb.apply(null, val);
  };
}

function StringStrategy(dependencies) {
  this.requiredDependencies = [dependencies];

  this.buildReturningValue = function buildReturningValue(allDependencies) {
    return allDependencies[this.requiredDependencies[0]];
  };

  this.invokeCallback = function invokeCallback(cb, val) {
    cb.call(null, val);
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

  this.buildReturningValue = function buildReturningValue(allDependencies) {
    var returnedObject = {};
    this.requiredDependencies.forEach(function (dependencyName) {
      returnedObject[utils.parseName(dependencyName).resource] = allDependencies[dependencyName];
    });
    return returnedObject;
  };

  this.invokeCallback = function invokeCallback(cb, val) {
    cb.call(null, val);
  };
}

module.exports = function createDependencyStrategy(dependencies) {
  if (dependencies && dependencies.requiredDependencies) {
    return dependencies;
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