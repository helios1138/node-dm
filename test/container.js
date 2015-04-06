'use strict';

require('should');

global.Promise = global.Promise || require('promise');

var Container = require('../src/container').Container;

describe('container', function () {
  var container;

  beforeEach(function () {
    container = new Container();
  });

  describe('api', function () {
    describe('can define dependencies', function () {
      it('as a value', function () {
        container.get('some').provide('value', 123);

        return container
          .resolve(['some'])
          .then(function (result) {
            result.should.eql([123]);
          });
      });

      it('as a value that is a promise', function () {
        container.get('some').provide('value', Promise.resolve(456));

        return container
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

        container.get('some').provide('class', Some);

        return Promise.all([
          container.resolve(['some']),
          container.resolve(['some'])
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

          container.get('another').provide('value', 123);

          function Some() {
            timesCalled.some += 1;
            this.is = 'some';
          }

          container.get('some').provide('class', Some);

          function Other(some, another) {
            timesCalled.other += 1;
            this.is = 'other';
            this.some = some;
            this.another = another;

            some.should.be.instanceof(Some);
            another.should.equal(123);
          }

          Other.$depends = ['some', 'another'];

          container.get('other').provide('class', Other);

          return container.resolve(['other', 'some'])
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

          container.get('another').provide('value', 123);

          function Some() {
            timesCalled.some += 1;
            this.is = 'some';
          }

          container.get('some').provide('class', Some);

          function Other(deps) {
            timesCalled.other += 1;
            this.is = 'other';
            this.some = deps.some;
            this.another = deps.another;

            deps.some.should.be.instanceof(Some);
            deps.another.should.equal(123);
          }

          Other.$depends = { some: true, another: true };

          container.get('other').provide('class', Other);

          return container.resolve(['other', 'some'])
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

        container.get('some').provide('factory', getSome);

        return Promise.all([
          container.resolve(['some']),
          container.resolve(['some'])
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

          container.get('another').provide('value', 123);

          function Some() {
            timesCalled.some += 1;
            this.is = 'some';
          }

          container.get('some').provide('class', Some);

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

          container.get('other').provide('factory', getOther);

          return container.resolve(['other', 'some'])
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

          container.get('another').provide('value', 123);

          function Some() {
            timesCalled.some += 1;
            this.is = 'some';
          }

          container.get('some').provide('class', Some);

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

          container.get('other').provide('factory', getOther);

          return container.resolve(['other', 'some'])
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

        container.get('some').provide('factory', getSome);

        return Promise.all([
          container.resolve(['some']),
          container.resolve(['some'])
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
        container.get('object1').provide('value', { is: 'object1' });
        container.get('object2').provide('value', Promise.resolve({ is: 'object2' }));
        container.get('object3').provide('class', function () { this.is = 'object3'; });
        container.get('object4').provide('factory', function () { return { is: 'object4' }; });
        container.get('object5').provide('factory', function () { return Promise.resolve({ is: 'object5' }); });
      });

      it('as array', function () {
        return container
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
        return container
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

        container.get('some').provide('class', Some);
        container.get('other').provide('class', Other);

        return container.resolve(['some'])
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

        container.get('some').provide('factory', getSome);
        container.get('other').provide('factory', getOther);

        return container.resolve(['other'])
          .then(function () {
            called.should.have.properties({
              some:  false,
              other: true
            });
          });
      });
    });
  });

  describe('errors and messages', function () {
    it('propagates exceptions through dependency tree', function () {
      var called = {
        Level3Dep1:      false,
        Level3Dep2:      false,
        Level3Dep3:      false,
        Level2Dep1:      false,
        Level2Dep2:      false,
        Level1Dep1:      false,
        Level1Dep2:      false,
        Level1Dep1Catch: false,
        Level1Dep2Catch: false
      };

      function Level3Dep1() {
        called.Level3Dep1 = true;
        throw new Error('some exception happened');
      }

      container.get('level3Dep1').provide('class', Level3Dep1);

      function Level3Dep2() {
        called.Level3Dep2 = true;
      }

      container.get('level3Dep2').provide('class', Level3Dep2);

      function Level3Dep3() {
        called.Level3Dep3 = true;
      }

      container.get('level3Dep3').provide('class', Level3Dep3);

      function Level2Dep1() {
        called.Level2Dep1 = true;
      }

      Level2Dep1.$depends = ['level3Dep1', 'level3Dep2'];

      container.get('level2Dep1').provide('class', Level2Dep1);

      function Level2Dep2() {
        called.Level2Dep2 = true;
      }

      Level2Dep2.$depends = ['level3Dep3'];

      container.get('level2Dep2').provide('class', Level2Dep2);

      function Level1Dep1() {
        called.Level1Dep1 = true;
      }

      Level1Dep1.$depends = ['level2Dep1', 'level2Dep2'];

      container.get('level1Dep1').provide('class', Level1Dep1);

      function Level1Dep2() {
        called.Level1Dep2 = true;
      }

      Level1Dep2.$depends = ['level2Dep2'];

      container.get('level1Dep2').provide('class', Level1Dep2);

      return Promise.all([
        container.resolve(['level1Dep1'])
          .then(function (result) {
          })
          .catch(function (err) {
            called.Level1Dep1Catch = true;
            err.should.have.property('message', 'some exception happened');
          }),
        container.resolve(['level1Dep2'])
          .then(function (result) {
            result[0].should.be.instanceof(Level1Dep2);
          })
          .catch(function () {
            called.Level1Dep2Catch = true;
          })
      ])
        .then(function () {
          called.should.have.properties({
            Level3Dep1:      true,
            Level3Dep2:      true,
            Level3Dep3:      true,
            Level2Dep1:      false,
            Level2Dep2:      true,
            Level1Dep1:      false,
            Level1Dep2:      true,
            Level1Dep1Catch: true,
            Level1Dep2Catch: false
          });
        });
    });

    it('propagates promise rejections through dependency tree', function () {
      var called = {
        a:     false,
        b:     false,
        then:  false,
        catch: false
      };

      function getA() {
        called.a = true;
        return Promise.reject(new Error('some reason'));
      }

      function getB() {
        called.b = true;
      }

      getB.$depends = { a: true };

      container.get('a').provide('factory', getA);
      container.get('b').provide('factory', getB);

      return container.resolve(['b'])
        .then(function () {
          called.then = true;
        })
        .catch(function (err) {
          called.catch = true;
          err.should.have.property('message', 'some reason');
        })
        .then(function () {
          called.should.have.properties({
            a:     true,
            b:     false,
            then:  false,
            catch: true
          });
        });
    });

    describe('notifies when a circular dependency occurs', function () {
      it('self-reference', function () {
        var called = {
          catch: false
        };

        function One() {

        }

        One.$depends = ['one'];

        container.get('one').provide('class', One);

        return container.resolve(['one'])
          .catch(function (err) {
            err.should.be.instanceof(Error).and.have.property('message', 'Circular dependency found: "one" < "one"');
            called.catch = true;
          })
          .then(function () {
            called.catch.should.equal(true);
          });
      });

      it('dependency loop', function () {
        var called = {
          catch: false
        };

        function One() {

        }

        One.$depends = ['two'];


        function Two() {

        }

        Two.$depends = ['three'];

        function Three() {

        }

        Three.$depends = ['four'];

        function Four() {

        }

        Four.$depends = ['one'];

        container.get('one').provide('class', One);
        container.get('two').provide('class', Two);
        container.get('three').provide('class', Three);
        container.get('four').provide('class', Four);

        return container.resolve(['one'])
          .catch(function (err) {
            err.should.be.instanceof(Error).and.have.property(
              'message',
              'Circular dependency found: "one" < "two" < "three" < "four" < "one"'
            );
            called.catch = true;
          })
          .then(function () {
            called.catch.should.equal(true);
          });
      });

      it('short dependency loop', function () {
        var called = {
          catch: false
        };

        function One() {

        }

        One.$depends = ['two'];


        function Two() {

        }

        Two.$depends = ['one'];

        container.get('one').provide('class', One);
        container.get('two').provide('class', Two);

        return container.resolve(['one'])
          .catch(function (err) {
            err.should.be.instanceof(Error).and.have.property(
              'message',
              'Circular dependency found: "one" < "two" < "one"'
            );
            called.catch = true;
          })
          .then(function () {
            called.catch.should.equal(true);
          });
      });

      it('dependency lasso', function () {
        var called = {
          catch: false
        };

        function One() {

        }

        One.$depends = ['two'];


        function Two() {

        }

        Two.$depends = ['three'];

        function Three() {

        }

        Three.$depends = ['four'];

        function Four() {

        }

        Four.$depends = ['two'];

        container.get('one').provide('class', One);
        container.get('two').provide('class', Two);
        container.get('three').provide('class', Three);
        container.get('four').provide('class', Four);

        return container.resolve(['one'])
          .catch(function (err) {
            err.should.be.instanceof(Error).and.have.property(
              'message',
              'Circular dependency found: "two" < "three" < "four" < "two"'
            );
            called.catch = true;
          })
          .then(function () {
            called.catch.should.equal(true);
          });
      });

      it('short dependency lasso', function () {
        var called = {
          catch: false
        };

        function One() {

        }

        One.$depends = ['two'];


        function Two() {

        }

        Two.$depends = ['three'];

        function Three() {

        }

        Three.$depends = ['four'];

        function Four() {

        }

        Four.$depends = ['three'];

        container.get('one').provide('class', One);
        container.get('two').provide('class', Two);
        container.get('three').provide('class', Three);
        container.get('four').provide('class', Four);

        return container.resolve(['one'])
          .catch(function (err) {
            err.should.be.instanceof(Error).and.have.property(
              'message',
              'Circular dependency found: "three" < "four" < "three"'
            );
            called.catch = true;
          })
          .then(function () {
            called.catch.should.equal(true);
          });
      });

    });

    it('notifies when dependency with the same name provided twice', function () {
      var called = false;

      container.get('some').provide('class', function Some1() {});

      try {
        container.get('some').provide('class', function Some2() {});
      }
      catch (err) {
        err.should.be.instanceof(Error).and.have.property('message', 'Dependency "some" was already provided');
        called = true;
      }

      called.should.equal(true);
    });
  });
});