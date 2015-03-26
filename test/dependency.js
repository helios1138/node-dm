'use strict';

require('should');

global.Promise = global.Promise || require('promise');

var Dependency = require('../src/dependency').Dependency;

describe('dependency', function () {
  var dependency;

  beforeEach(function () {
    dependency = new Dependency({
      resolve: function () { return Promise.resolve([]); }
    });
  });

  it('can be a value', function () {
    dependency.provide('value', 123);

    return dependency.getPromise()
      .then(function (result) {
        result.should.equal(123);
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

  it('can be an async factory', function () {
    var someObject = { is: 'something' };

    function getSomeObject(done) {
      setTimeout(function () {
        done(someObject);
      }, 0);
    }

    dependency.provide('asyncFactory', getSomeObject);

    return dependency.getPromise()
      .then(function (result) {
        result.should.equal(someObject);
      });
  });
});