'use strict';

describe('dependency injection', function () {
  var dim;

  beforeEach(function () {
    dim = require('../src/dim')();
  });

  describe('explicit api', function () {
    it('allows to describe a single dependency and provide it', function (done) {
      dim.depend(
        'depA',

        function (depA) {
          depA.should.equal('A');
          done();
        }
      );

      dim.provide('depA', 'A');
    });

    it('allows to depend on multiple dependencies', function (done) {
      dim.depend(
        'depA',
        'depB',

        function (depA, depB) {
          depA.should.equal('A');
          depB.should.equal('B');
          done();
        }
      );

      dim.provide('depA', 'A');
      dim.provide('depB', 'B');
    });

    it('works regardless of the order in which dependencies are provided', function (done) {

      dim.provide('depB', 'B');

      dim.depend(
        'depA',
        'depB',

        function (depA, depB) {
          depA.should.equal('A');
          depB.should.equal('B');
          done();
        }
      );

      dim.provide('depA', 'A');
    });

    it('works asynchronously', function (done) {
      dim.depend(
        'depA',
        'depB',

        function (depA, depB) {
          depA.should.equal('A');
          depB.should.equal('B');
          done();
        }
      );

      setTimeout(function () {
        dim.provide('depA', 'A');
      }, 500);
      setTimeout(function () {
        dim.provide('depB', 'B');
      }, 1000);
    });
  });

  describe('resource api', function () {
    it('allows to describe resources that can change their states', function (done) {
      var
        diResourceA = dim.resource('resourceA'),
        resourceA = {state: null},
        results = [];

      diResourceA.provide(function () {return resourceA;}).setState('initial');

      setTimeout(function () {
        resourceA.state = 'started';
        diResourceA.setState('started');
      }, 500);

      setTimeout(function () {
        resourceA.state = 'finished';
        diResourceA.setState('finished');
      }, 1000);

      dim.depend(
        'resourceA',

        function (resourceA) {
          try {
            resourceA.should.have.property('state', null);
          }
          catch(e) {
            done(e);
          }
          results.push(1);
        }
      );

      dim.depend(
        'resourceA:initial',

        function (resourceA) {
          try {
            resourceA.should.have.property('state', null);
          }
          catch(e) {
            done(e);
          }
          results.push(2);
        }
      );

      dim.depend(
        'resourceA:started',

        function (resourceA) {
          try {
            resourceA.should.have.property('state', 'started');
          }
          catch(e) {
            done(e);
          }
          results.push(3);
        }
      );

      dim.depend(
        'resourceA:finished',

        function (resourceA) {
          try {
            resourceA.should.have.property('state', 'finished');
          }
          catch(e) {
            done(e);
          }
          results.push(4);
          checkOrderOfResults();
        }
      );

      function checkOrderOfResults() {
        try {
          results.should.have.length(4);
          results.should.eql([1, 2, 3, 4]);
          done();
        }
        catch(e) {
          done(e);
        }
      }
    });

    it('allows to created resources that can have dependencies', function (done) {
      dim.resource('resourceA', function () {
        return 'A';
      });

      dim.resource('resourceB', [
        'resourceA',

        function (resourceA) {
          try {
            resourceA.should.equal('A');
          }
          catch(e) {
            done(e);
          }

          return 'B';
        }
      ]);

      dim.resource('resourceC', [
        'resourceA',
        'resourceB',

        function (resourceA, resourceB) {
          try {
            resourceA.should.equal('A');
            resourceB.should.equal('B');
            done();
          }
          catch(e) {
            done(e);
          }
        }
      ]);
    });

    it('allows resources to be created asynchronously', function (done) {
      dim.resource('resourceA', function () {
        return 'A';
      });

      setTimeout(function () {
        var diResourceB = dim.resource('resourceB', [
          'resourceA',

          function (resourceA) {
            try {
              resourceA.should.equal('A');
            }
            catch(e) {
              done(e);
            }

            var obj = {
              ready: false
            };

            setTimeout(function () {
              obj.ready = true;
              diResourceB.setState('ready');
            }, 500);

            return obj;
          }
        ]);
      }, 500);

      dim.resource('resourceC', [
        'resourceA',
        'resourceB',

        function (resourceA, resourceB) {
          try {
            resourceA.should.equal('A');
            resourceB.should.have.property('ready', false);
          }
          catch(e) {
            done(e);
          }
        }
      ]);

      dim.resource('resourceD', [
        'resourceA',
        'resourceB:ready',

        function (resourceA, resourceB) {
          try {
            resourceA.should.equal('A');
            resourceB.should.have.property('ready', true);
            done();
          }
          catch(e) {
            done(e);
          }
        }
      ]);
    });

    it('should allow to separate depend and provide calls', function (done) {
      dim.provide('A', {name: 'A'});

      dim.resource('B')
        .depend('A')
        .provide(function (A) {
          return {name: A.name + 'B'};
        });

      dim.depend('B', function (B) {
        try {
          B.name.should.equal('AB');
          done();
        }
        catch(e) {
          done(e);
        }
      });
    });
  });

  describe('promise api', function () {
    it('allows to use promises that will be resolved with an array of dependencies', function (done) {
      dim.provide('some', 13);

      setTimeout(function () {
        dim.provide('other', 14);
      }, 500);

      dim.depend('some', 'other')
        .then(function (deps) {
          try {
            deps.should.have.length(2);
            deps[0].should.equal(13);
            deps[1].should.equal(14);
            done();
          }
          catch(e) {
            done(e);
          }
        });
    });

    it('allows to get a single dependency using promises', function (done) {
      setTimeout(function () {
        dim.provide('some', 15);
      }, 500);

      dim.get('some')
        .then(function (some) {
          try {
            some.should.equal(15);
            done();
          }
          catch(e) {
            done(e);
          }
        });
    });
  });
});