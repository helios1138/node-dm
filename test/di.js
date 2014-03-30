'use strict';

describe('dependency injection', function() {
  var di;

  beforeEach(function() {
    di = require('../src/di')();
  });

  describe('explicit api', function() {
    it('allows to describe a single dependency and provide it', function(done) {
      di.depend(
        'depA',

        function(depA) {
          depA.should.equal('A');
          done();
        }
      );

      di.provide('depA', 'A');
    });

    it('allows to depend on multiple dependencies', function(done) {
      di.depend(
        'depA',
        'depB',

        function(depA, depB) {
          depA.should.equal('A');
          depB.should.equal('B');
          done();
        }
      );

      di.provide('depA', 'A');
      di.provide('depB', 'B');
    });

    it('works regardless of the order in which dependencies are provided', function(done) {

      di.provide('depB', 'B');

      di.depend(
        'depA',
        'depB',

        function(depA, depB) {
          depA.should.equal('A');
          depB.should.equal('B');
          done();
        }
      );

      di.provide('depA', 'A');
    });

    it('works asynchronously', function(done) {
      di.depend(
        'depA',
        'depB',

        function(depA, depB) {
          depA.should.equal('A');
          depB.should.equal('B');
          done();
        }
      );

      setTimeout(function() {
        di.provide('depA', 'A');
      }, 500);
      setTimeout(function() {
        di.provide('depB', 'B');
      }, 1000);
    });
  });

  describe('resource api', function() {
    it('allows to describe resources that can change their states', function(done) {
      var
        diResourceA = di.resource('resourceA'),
        resourceA = {state: null},
        results = [];

      diResourceA.provide(resourceA).is('initial');

      setTimeout(function() {
        resourceA.state = 'started';
        diResourceA.is('started');
      }, 500);

      setTimeout(function() {
        resourceA.state = 'finished';
        diResourceA.is('finished');
      }, 1000);

      di.depend(
        'resourceA',

        function(resourceA) {
          try {
            resourceA.should.have.property('state', null);
          }
          catch(e) {
            done(e);
          }
          results.push(1);
        }
      );

      di.depend(
        'resourceA:initial',

        function(resourceA) {
          try {
            resourceA.should.have.property('state', null);
          }
          catch(e) {
            done(e);
          }
          results.push(2);
        }
      );

      di.depend(
        'resourceA:started',

        function(resourceA) {
          try {
            resourceA.should.have.property('state', 'started');
          }
          catch(e) {
            done(e);
          }
          results.push(3);
        }
      );

      di.depend(
        'resourceA:finished',

        function(resourceA) {
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

    it('allows to created resources that can have dependencies', function(done) {
      di.resource('resourceA', function() {
        return 'A';
      });

      di.resource('resourceB', [
        'resourceA',

        function(resourceA) {
          try {
            resourceA.should.equal('A');
          }
          catch(e) {
            done(e);
          }

          return 'B';
        }
      ]);

      di.resource('resourceC', [
        'resourceA',
        'resourceB',

        function(resourceA, resourceB) {
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

    it('allows resources to be created asynchronously', function(done) {
      di.resource('resourceA', function() {
        return 'A';
      });

      setTimeout(function() {
        var diResourceB = di.resource('resourceB', [
          'resourceA',

          function(resourceA) {
            try {
              resourceA.should.equal('A');
            }
            catch(e) {
              done(e);
            }

            var obj = {
              ready: false
            };

            setTimeout(function() {
              obj.ready = true;
              diResourceB.is('ready');
            }, 500);

            return obj;
          }
        ]);
      }, 500);

      di.resource('resourceC', [
        'resourceA',
        'resourceB',

        function(resourceA, resourceB) {
          try {
            resourceA.should.equal('A');
            resourceB.should.have.property('ready', false);
          }
          catch(e) {
            done(e);
          }
        }
      ]);

      di.resource('resourceD', [
        'resourceA',
        'resourceB:ready',

        function(resourceA, resourceB) {
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
  });

  describe('promise api', function() {
    it('allows to use promises that will be resolved with an array of dependencies', function(done) {
      di.provide('some', 13);

      setTimeout(function() {
        di.provide('other', 14);
      }, 500);

      di.depend('some', 'other')
        .then(function(deps) {
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

    it('allows to get a single dependency using promises', function(done) {
      setTimeout(function() {
        di.provide('some', 15);
      }, 500);

      di.get('some')
        .then(function(some) {
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