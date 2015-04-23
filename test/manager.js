'use strict';

require('should');
global.Promise = global.Promise || require('promise');

var Manager   = require('../src/manager').Manager,
    Container = require('../src/container').Container;

describe('manager', function () {
  var dm;

  describe('api', function () {
    it('provides shorthand methods for defining dependencies', function () {
      var called    = [],
          container = {
            get: function (name) {
              return {
                provide: function (type, value) {
                  called.push({
                    name:  name,
                    type:  type,
                    value: value
                  });
                }
              };
            }
          };

      dm = new Manager(container);

      function SomeClass() {}

      function otherFactory() {}

      dm.class('some', SomeClass);
      dm.factory('other', otherFactory);
      dm.value('another', 123);

      called.should.have.length(3);
      called.should.eql([
        { name: 'some', type: 'class', value: SomeClass },
        { name: 'other', type: 'factory', value: otherFactory },
        { name: 'another', type: 'value', value: 123 }
      ]);
    });

    it('provides shorthand methods for resolving the root dependency', function () {
      var called    = [],
          value     = { is: 'value' },
          container = {
            resolve: function (dependencies) {
              called.push(dependencies);
              return Promise.resolve(value);
            }
          };

      dm = new Manager(container);

      var result = dm.run('app');

      called.should.have.length(1);
      called.should.eql([['app']]);

      return result
        .then(function (result) {
          result.should.equal(value);
        });
    });
  });

  describe('errors and messages', function () {
    it('notifies when dependency is requested but not resolved in some time', function () {
      dm = new Manager(new Container());

      var called = {
        catch: false
      };

      dm.config({
        dependencyTimeout: 100
      });

      dm.value('some', new Promise(function (resolve) {
        setTimeout(resolve.bind(null), 10);
      }));

      function Redis() {

      }

      dm.class('redis', Redis);

      function getConfig(fs) {
        return {};
      }

      getConfig.$depends = ['fs'];

      dm.factory('config', getConfig);

      function connect(config) {
        return {};
      }

      connect.$depends = ['config'];

      dm.factory('db', connect);

      function App(db, redis) {
        this.is = 'app';
      }

      App.$depends = ['db', 'redis'];

      dm.class('app', App);

      return dm.run('app')
        .catch(function (err) {
          console.log(err);
          err.should.be.instanceof(Error).and.have.property('message', 'Dependency "some" was not resolved in 100ms');
          called.catch = true;
        })
        .then(function () {
          called.catch.should.equal(true);
        });
    });
  });
});