'use strict';

var
  q = require('q'),
  DM = require('../src/dm');

describe('dependency injection', function () {
  var dm;

  beforeEach(function () {
    dm = new DM();
  });

  describe('explicit api', function () {
    it('one dependency', function (done) {
      dm.set('a', 1);

      dm.get('a', function (a) {
        a.should.equal(1);
        done();
      });
    });

    it('one dependency, reversed order', function (done) {
      dm.get('a', function (a) {
        a.should.equal(1);
        done();
      });

      dm.set('a', 1);
    });

    it('one dependency, promise', function () {
      dm.set('a', 1);

      return dm
        .get('a')
        .spread(function (a) {
          a.should.equal(1);
        });
    });

    it('one dependency, reversed order, promise', function () {
      var result = dm
        .get('a')
        .spread(function (a) {
          a.should.equal(1);
        });

      dm.set('a', 1);

      return result;
    });

    it('multiple dependencies', function (done) {
      dm.set('a', 1);

      dm.get(['a', 'b'], function (a, b) {
        a.should.equal(1);
        b.should.equal(2);
        done();
      });

      dm.set('b', 2);
    });

    it('multiple dependencies, reversed order', function () {
      dm.set('a', 1);

      var result = dm.get(['a', 'b']);

      dm.set('b', 2);

      return result
        .spread(function (a, b) {
          a.should.equal(1);
          b.should.equal(2);
        });
    });
  });

  describe('resource api', function () {
    it('provides resource object', function () {
      var pointer1 = dm.resource('a');
      var pointer2 = dm.resource('a');

      pointer1.should.equal(pointer2);
    });

    it('allows resources to be provided as dependencies', function () {
      dm.resource('a').provide(1);

      return dm.get('a')
        .spread(function (a) {
          a.should.equal(1);
        });
    });

    it('allows resources to be provided only when their dependencies are resolved', function () {
      dm.resource('c')
        .depends(['a', 'b'])
        .provide(3);

      dm.set('a', 1);
      dm.set('b', 2);

      return dm.get('c')
        .spread(function (c) {
          c.should.equal(3);
        });
    });

    it('allows resources to use their dependencies when providing', function () {
      dm.resource('c')
        .depends(['a', 'b'], function (a, b) {
          a.should.equal(1);
          b.should.equal(2);
        })
        .provide(3);

      dm.set('a', 1);
      dm.set('b', 2);

      return dm.get('c')
        .spread(function (a) {
          a.should.equal(3);
        });
    });

    it('allows resource to be provided in a callback used to resolve their dependencies', function () {
      dm.resource('c')
        .depends(['a', 'b'], function (a, b) {
          a.should.equal('some');
          b.should.equal('string');

          return a + ' ' + b;
        });

      dm.set('a', 'some');
      dm.set('b', 'string');

      return dm.get('c')
        .spread(function (c) {
          c.should.equal('some string');
        });
    });

    it('async test', function () {
      dm.resource('c')
        .depends(['a', 'b'], function (a, b) {
          a.should.equal('some');
          b.should.equal('string');

          return a + ' ' + b;
        });

      setTimeout(function () {
        dm.set('a', 'some');
      }, 100);

      dm.set('b', 'string');

      return dm.get('c')
        .spread(function (c) {
          c.should.equal('some string');
        });
    });
  });

  describe('resource states', function () {
    it('allows resources to have different states', function () {
      var a = {
        value: 1
      };

      dm.resource('a')
        .provide(a)
        .setState('new');

      setTimeout(function () {
        a.value = 2;
        dm.resource('a').setState('old');
      }, 100);

      return q.all([
        dm.get('a:new', function (a) {
          a.value.should.equal(1);
        }),
        dm.get('a:old', function (a) {
          a.value.should.equal(2);
        })
      ]);
    });

    it('should keep the order in which dependents would get the resource in certain states', function () {
      var some = {};

      dm.resource('some')
        .provide(some)
        .setState('initializing')
        .setState('initialized');

      dm.get('some:initializing', function (some) {
        some.some = 'someValue';
      });

      var result = dm.get('some:initialized', function (some) {
        some.should.have.property('some', 'someValue');
        some.should.have.property('other', 'otherValue');
      });

      dm.get('some:initializing', function (some) {
        some.other = 'otherValue';
      });

      return result;
    });
  });
});