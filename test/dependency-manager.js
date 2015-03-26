'use strict';

require('should');

global.Promise = global.Promise || require('promise');

var DependencyManager = require('../src/dependency-manager').DependencyManager;

describe('dependencyManager', function () {
  var dm;

  beforeEach(function () {
    dm = new DependencyManager();
  });

  describe('can define dependencies', function () {
    it('as a value', function () {
      dm.provide('some', 'value', 123);

      return dm
        .resolve(['some'])
        .then(function (result) {
          result.should.eql([123]);
        });
    });

    it('as a value that is a promise', function () {
      dm.provide('some', 'value', Promise.resolve(456));

      return dm
        .resolve(['some'])
        .then(function (result) {
          result.should.eql([456]);
        });
    });

    it('as a class', function () {
      var timesCalled = 0;

      function Some() {
        timesCalled += 1;
        this.is = 'some';
      }

      dm.provide('some', 'class', Some);

      return Promise.all([
        dm.resolve(['some']),
        dm.resolve(['some'])
      ])
        .then(function (result) {
          result.should.have.length(2);

          var first  = result[0][0],
              second = result[1][0];

          first.should.be.instanceof(Some);
          second.should.be.instanceof(Some);
          first.should.equal(second);
          timesCalled.should.equal(1);
        });
    });

    it('as a factory', function () {
      var timesCalled = 0;

      function getSome() {
        timesCalled += 1;

        return {
          is: 'some'
        };
      }

      dm.provide('some', 'factory', getSome);

      return Promise.all([
        dm.resolve(['some']),
        dm.resolve(['some'])
      ])
        .then(function (result) {
          result.should.have.length(2);

          var first  = result[0][0],
              second = result[1][0];

          first.should.have.property('is', 'some');
          second.should.have.property('is', 'some');
          first.should.equal(second);
          timesCalled.should.equal(1);
        });
    });

    it('as a factory returning a promise', function () {
      var timesCalled = 0;

      function getSome() {
        timesCalled += 1;

        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve({
              is: 'some'
            });
          }, 0);
        });
      }

      dm.provide('some', 'factory', getSome);

      return Promise.all([
        dm.resolve(['some']),
        dm.resolve(['some'])
      ])
        .then(function (result) {
          result.should.have.length(2);

          var first  = result[0][0],
              second = result[1][0];

          first.should.have.property('is', 'some');
          second.should.have.property('is', 'some');
          first.should.equal(second);
          timesCalled.should.equal(1);
        });
    });
  });

  describe('can resolve dependencies', function () {
    beforeEach(function () {
      dm.provide('object1', 'value', { is: 'object1' });
      dm.provide('object2', 'value', Promise.resolve({ is: 'object2' }));
      dm.provide('object3', 'class', function () { this.is = 'object3'; });
      dm.provide('object4', 'factory', function () { return { is: 'object4' }; });
      dm.provide('object5', 'factory', function () { return Promise.resolve({ is: 'object5' }); });
    });

    it('as array', function () {
      return dm
        .resolve(['object1', 'object2', 'object3', 'object4', 'object5'])
        .then(function (result) {
          result.should.have.length(5);
          result[0].should.have.property('is', 'object1');
          result[1].should.have.property('is', 'object2');
          result[2].should.have.property('is', 'object3');
          result[3].should.have.property('is', 'object4');
          result[4].should.have.property('is', 'object5');
        });
    });

    it('as object', function () {
      return dm
        .resolve({ object1: true, object2: true, object3: true, object4: true, object5: true })
        .then(function (result) {
          result.should.have.keys(['object1', 'object2', 'object3', 'object4', 'object5']);
          result.object1.should.have.property('is', 'object1');
          result.object2.should.have.property('is', 'object2');
          result.object3.should.have.property('is', 'object3');
          result.object4.should.have.property('is', 'object4');
          result.object5.should.have.property('is', 'object5');
        });
    });
  });

  it('provides shorthand methods for defining dependencies', function () {
    dm.provide('some', 'value', 123);
    dm.value('some', 123);
  });
});