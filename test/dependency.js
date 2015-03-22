'use strict';

require('should');

global.Promise = Promise || require('promise');

var Dependency = require('../src/dependency').Dependency;

describe('dependency', function () {
  var dependency;

  beforeEach(function () {
    dependency = new Dependency({
      resolve: function () { return Promise.resolve([]); }
    });
  });

  it('can represent values', function () {
    dependency.provide('value', 123);

    return dependency.getPromise()
      .then(function (result) {
        result.should.equal(123);
      });
  });

  it('can represent classes', function () {
    function Person() {}

    dependency.provide('class', Person);

    return dependency.getPromise()
      .then(function (result) {
        result.should.be.instanceOf(Person);
      });
  });

  it('can represent factories', function () {
    var someObject = { is: 'something' };

    function getSomeObject() {
      return someObject;
    }

    dependency.provide('factory', getSomeObject);

    return dependency.getPromise()
      .then(function (result) {
        result.should.equal(someObject);
      })
  });
});