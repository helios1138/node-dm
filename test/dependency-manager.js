'use strict';

require('should');

global.Promise = global.Promise || require('promise');

var DependencyManager = require('../src/dependency-manager').DependencyManager;

describe('api', function () {
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

    describe('as a class with dependencies', function () {
      it('as an array', function () {
        var timesCalled = {
          some:  0,
          other: 0
        };

        dm.provide('another', 'value', 123);

        function Some() {
          timesCalled.some += 1;
          this.is = 'some';
        }

        dm.provide('some', 'class', Some);

        function Other(some, another) {
          timesCalled.other += 1;
          this.is = 'other';
          this.some = some;
          this.another = another;

          some.should.be.instanceof(Some);
          another.should.equal(123);
        }

        Other.$depends = ['some', 'another'];

        dm.provide('other', 'class', Other);

        return dm.resolve(['other', 'some'])
          .then(function (result) {
            result.should.have.length(2);

            var other = result[0],
                some  = result[1];

            other.should.be.instanceof(Other);
            other.should.have.property('is', 'other');
            other.should.have.properties(['some', 'another']);
            other.some.should.be.instanceof(Some);
            other.another.should.equal(123);

            some.should.be.instanceof(Some);
            some.should.equal(other.some);

            timesCalled.some.should.equal(1);
            timesCalled.other.should.equal(1);
          });
      });

      it('as an object', function () {
        var timesCalled = {
          some:  0,
          other: 0
        };

        dm.provide('another', 'value', 123);

        function Some() {
          timesCalled.some += 1;
          this.is = 'some';
        }

        dm.provide('some', 'class', Some);

        function Other(deps) {
          timesCalled.other += 1;
          this.is = 'other';
          this.some = deps.some;
          this.another = deps.another;

          deps.some.should.be.instanceof(Some);
          deps.another.should.equal(123);
        }

        Other.$depends = { some: true, another: true };

        dm.provide('other', 'class', Other);

        return dm.resolve(['other', 'some'])
          .then(function (result) {
            result.should.have.length(2);

            var other = result[0],
                some  = result[1];

            other.should.be.instanceof(Other);
            other.should.have.property('is', 'other');
            other.should.have.properties(['some', 'another']);
            other.some.should.be.instanceof(Some);
            other.another.should.equal(123);

            some.should.be.instanceof(Some);
            some.should.equal(other.some);

            timesCalled.some.should.equal(1);
            timesCalled.other.should.equal(1);
          });
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

    describe('as a factory with dependencies', function () {
      it('as an array', function () {
        var timesCalled = {
          some:  0,
          other: 0
        };

        dm.provide('another', 'value', 123);

        function Some() {
          timesCalled.some += 1;
          this.is = 'some';
        }

        dm.provide('some', 'class', Some);

        function getOther(some, another) {
          timesCalled.other += 1;

          some.should.be.instanceof(Some);
          another.should.equal(123);

          return {
            is:      'other',
            some:    some,
            another: another
          };
        }

        getOther.$depends = ['some', 'another'];

        dm.provide('other', 'factory', getOther);

        return dm.resolve(['other', 'some'])
          .then(function (result) {
            result.should.have.length(2);

            var other = result[0],
                some  = result[1];

            other.should.have.property('is', 'other');
            other.should.have.properties(['some', 'another']);
            other.some.should.be.instanceof(Some);
            other.another.should.equal(123);

            some.should.be.instanceof(Some);
            some.should.equal(other.some);

            timesCalled.some.should.equal(1);
            timesCalled.other.should.equal(1);
          });
      });

      it('as an object', function () {
        var timesCalled = {
          some:  0,
          other: 0
        };

        dm.provide('another', 'value', 123);

        function Some() {
          timesCalled.some += 1;
          this.is = 'some';
        }

        dm.provide('some', 'class', Some);

        function getOther(deps) {
          timesCalled.other += 1;

          deps.some.should.be.instanceof(Some);
          deps.another.should.equal(123);

          return {
            is:      'other',
            some:    deps.some,
            another: deps.another
          };
        }

        getOther.$depends = { some: true, another: true };

        dm.provide('other', 'factory', getOther);

        return dm.resolve(['other', 'some'])
          .then(function (result) {
            result.should.have.length(2);

            var other = result[0],
                some  = result[1];

            other.should.have.property('is', 'other');
            other.should.have.properties(['some', 'another']);
            other.some.should.be.instanceof(Some);
            other.another.should.equal(123);

            some.should.be.instanceof(Some);
            some.should.equal(other.some);

            timesCalled.some.should.equal(1);
            timesCalled.other.should.equal(1);
          });
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
    dm.provide('some1', 'value', { is: 'some1' });
    dm.value('some2', { is: 'some2' });

    dm.provide('other1', 'class', function Other1() { this.is = 'other1'; });
    dm.class('other2', function Other2() { this.is = 'other2'; });

    dm.provide('another1', 'factory', function getAnother1() { return { is: 'another1' }; });
    dm.factory('another2', function getAnother2() { return { is: 'another2' }; });

    return dm.resolve(['some1', 'some2', 'other1', 'other2', 'another1', 'another2'])
      .then(function (results) {
        results.should.have.length(6);
      });
  });

  describe('only constructs dependencies when they are needed', function () {
    it('from classes', function () {
      var called = {
        some:  false,
        other: false
      };

      function Some() {
        called.some = true;
      }

      function Other() {
        called.other = true;
      }

      dm.class('some', Some);
      dm.class('other', Other);

      return dm.resolve(['some'])
        .then(function () {
          called.should.have.properties({
            some:  true,
            other: false
          });
        });
    });

    it('from factories', function () {
      var called = {
        some:  false,
        other: false
      };

      function getSome() {
        called.some = true;
        return {};
      }

      function getOther() {
        called.other = true;
        return {};
      }

      dm.factory('some', getSome);
      dm.factory('other', getOther);

      return dm.resolve(['other'])
        .then(function () {
          called.should.have.properties({
            some:  false,
            other: true
          });
        });
    });
  });
});