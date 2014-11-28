'use strict';

var should = require('should');

var DependencyManager = require('../src/dependency-manager');

describe('dependency injection', function () {
  var dm;

  beforeEach(function () {
    dm = new DependencyManager();
  });

  describe('core api', function () {
    it('allows to set and get dependency', function (done) {
      dm.set('a', 1);

      dm.get('a', function (a) {
        a.should.equal(1);
        done();
      });
    });

    it('allows to get dependency as a promise', function () {
      dm.set('a', 1);

      var promise = dm.get('a');

      promise.should.have.property('then');

      return promise.then(function (a) {
        a.should.equal(1);
      });
    });

    it('allows to get multiple dependencies as array', function (done) {
      dm.set('a', 1);
      dm.set('b', 2);

      dm.getAsArray(['a', 'b'], function (deps) {
        deps.should.be.an.Array.and.eql([1, 2]);
        dm.set('c', 3);
      });

      dm.getAsArray(['a', 'b', 'c'])
        .then(function (deps) {
          deps.should.be.an.Array.and.eql([1, 2, 3]);
          done();
        });
    });

    it('allows to get multiple dependencies as object', function (done) {
      dm.set('a', 1);
      dm.set('b', 2);

      dm.getAsObject(['a', 'b'], function (deps) {
        deps.should.be.an.Object.and.eql({ a: 1, b: 2 });
        dm.set('c', 3);
      });

      dm.getAsObject(['a', 'b', 'c'])
        .then(function (deps) {
          deps.should.be.an.Object.and.eql({ a: 1, b: 2, c: 3 });
          done();
        });
    });

    it('works asynchronously in any order', function () {
      dm.set('a', 1);

      dm.getAsObject(['a', 'b'])
        .then(function (deps) {
          deps.should.be.an.Object.and.eql({ a: 1, b: 2 });

          setTimeout(function () {
            dm.set('c', 3);
          }, 50);
        });

      setTimeout(function () {
        dm.set('b', 2);
      }, 50);

      return dm
        .get('c')
        .then(function (c) {
          c.should.equal(3);
        });
    });
  });

  describe('injection api', function () {
    it('can use constructors to create dependencies', function () {
      function Animal() {}

      dm.provide('dog', ['class', Animal]);
      dm.provide('cat', ['type', Animal]);

      return dm
        .getAsObject(['dog', 'cat'])
        .then(function (deps) {
          deps
            .should.be.an.Object
            .and
            .have.properties(['dog', 'cat']);

          deps.dog.should.be.an.instanceof(Animal);
          deps.cat.should.be.an.instanceof(Animal);

          deps.dog.should.not.equal(deps.cat);
        });
    });

    it('can use factory functions to create dependencies', function () {
      function getObject() {
        return {
          some: 'value'
        };
      }

      dm.provide('object', ['factory', getObject]);

      return dm
        .get('object')
        .then(function (object) {
          object.should.have.property('some', 'value');
        });
    });

    it('can use any value directly as a dependency', function () {
      function some() {}

      dm.provide('pi', ['value', 3.14]);
      dm.provide('func', ['value', some]);

      return dm
        .getAsObject(['pi', 'func'])
        .then(function (deps) {
          deps
            .should.be.an.Object
            .and
            .have.properties(['pi', 'func']);

          deps.pi.should.equal(3.14);
          deps.func.should.equal(some);
        });
    });

    describe('injects dependencies to constructors', function () {
      it('as an array (using $depends)', function () {
        function Class(a, b) {
          a.should.equal(1);
          b.should.equal(2);

          this.a = a;
          this.b = b;
        }

        Class.$depends = ['a', 'b'];

        dm.provide('instance', ['class', Class]);

        dm.set('a', 1);
        dm.set('b', 2);

        return dm
          .get('instance')
          .then(function (instance) {
            instance
              .should.be.instanceof(Class)
              .and
              .have.properties({ a: 1, b: 2 });
          });
      });

      it('as an array (requested explicitly)', function () {
        function Class(a, b) {
          a.should.equal(1);
          b.should.equal(2);

          this.a = a;
          this.b = b;
        }

        dm.provide('instance', ['class', Class, ['a', 'b']]);

        dm.set('a', 1);
        dm.set('b', 2);

        return dm
          .get('instance')
          .then(function (instance) {
            instance
              .should.be.instanceof(Class)
              .and
              .have.properties({ a: 1, b: 2 });
          });
      });

      it('as an object (using $depends)', function () {
        function Class(deps) {
          deps
            .should.be.an.Object
            .and
            .have.properties({ a: 1, b: 2 });

          this.a = deps.a;
          this.b = deps.b;
        }

        Class.$depends = { a: true, b: true };

        dm.provide('instance', ['class', Class]);

        dm.set('a', 1);
        dm.set('b', 2);

        return dm
          .get('instance')
          .then(function (instance) {
            instance
              .should.be.instanceof(Class)
              .and
              .have.properties({ a: 1, b: 2 });
          });
      });

      it('as an object (requested explicitly)', function () {
        function Class(deps) {
          deps
            .should.be.an.Object
            .and
            .have.properties({ a: 1, b: 2 });

          this.a = deps.a;
          this.b = deps.b;
        }

        dm.provide('instance', ['class', Class, { a: true, b: true }]);

        dm.set('a', 1);
        dm.set('b', 2);

        return dm
          .get('instance')
          .then(function (instance) {
            instance
              .should.be.instanceof(Class)
              .and
              .have.properties({ a: 1, b: 2 });
          });
      });
    });

    describe('injects dependencies to factories', function () {
      it('as an array (using $depends)', function () {
        function getObject(a, b) {
          a.should.equal(1);
          b.should.equal(2);

          return {
            a: a,
            b: b
          };
        }

        getObject.$depends = ['a', 'b'];

        dm.provide('instance', ['factory', getObject]);

        dm.set('a', 1);
        dm.set('b', 2);

        return dm
          .get('instance')
          .then(function (instance) {
            instance.should.have.properties({ a: 1, b: 2 });
          });
      });

      it('as an array (requested explicitly)', function () {
        function getObject(a, b) {
          a.should.equal(1);
          b.should.equal(2);

          return {
            a: a,
            b: b
          };
        }

        dm.provide('instance', ['factory', getObject, ['a', 'b']]);

        dm.set('a', 1);
        dm.set('b', 2);

        return dm
          .get('instance')
          .then(function (instance) {
            instance.should.have.properties({ a: 1, b: 2 });
          });
      });

      it('as an object (using $depends)', function () {
        function getObject(deps) {
          deps
            .should.be.an.Object
            .and
            .have.properties({ a: 1, b: 2 });

          return {
            a: deps.a,
            b: deps.b
          };
        }

        getObject.$depends = { a: true, b: true };

        dm.provide('instance', ['factory', getObject]);

        dm.set('a', 1);
        dm.set('b', 2);

        return dm
          .get('instance')
          .then(function (instance) {
            instance.should.have.properties({ a: 1, b: 2 });
          });
      });

      it('as an object (requested explicitly)', function () {
        function getObject(deps) {
          deps
            .should.be.an.Object
            .and
            .have.properties({ a: 1, b: 2 });

          return {
            a: deps.a,
            b: deps.b
          };
        }

        dm.provide('instance', ['factory', getObject, { a: true, b: true }]);

        dm.set('a', 1);
        dm.set('b', 2);

        return dm
          .get('instance')
          .then(function (instance) {
            instance.should.have.properties({ a: 1, b: 2 });
          });
      });
    });

    describe('returns original source after providing dependency', function () {
      // Either this should not happen
      // or dependencies should not be created until the first `invoke()` call '
      throw new Error();
    });
  });
});