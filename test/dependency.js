'use strict';

require('should');

global.Promise = global.Promise || require('promise');

var Dependency = require('../src/dependency').Dependency;

describe('dependency', function () {
  var dmMock = {
        resolve: function () { return Promise.resolve([]); }
      },
      dependency;

  beforeEach(function () {
    dependency = new Dependency(dmMock);
  });

  it('can be a value', function () {
    dependency.provide('value', 123);

    return dependency.getPromise()
      .then(function (result) {
        result.should.equal(123);
      });
  });

  it('can be a value that is a promise', function () {
    dependency.provide('value', Promise.resolve(456));

    return dependency.getPromise()
      .then(function (result) {
        result.should.equal(456);
      });
  });

  it('can be a class', function () {
    function Person() {}

    dependency.provide('class', Person);

    return dependency.getPromise()
      .then(function (result) {
        result.should.be.instanceOf(Person);
      });
  });

  it('can be a factory', function () {
    var someObject = { is: 'something' };

    function getSomeObject() {
      return someObject;
    }

    dependency.provide('factory', getSomeObject);

    return dependency.getPromise()
      .then(function (result) {
        result.should.equal(someObject);
      });
  });

  it('can be a factory returning a promise', function () {
    var someObject = { is: 'something' };

    function getSomeObject() {
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve(someObject);
        }, 0);
      });
    }

    dependency.provide('factory', getSomeObject);

    return dependency.getPromise()
      .then(function (result) {
        result.should.equal(someObject);
      });
  });
});