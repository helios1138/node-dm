'use strict';

require('should');
global.Promise = global.Promise || require('promise');

var Manager   = require('../src/manager'),
    Container = require('../src/container');

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

    it('shorthand methods can also define dependencies directly', function () {
      var called    = [],
          container = {
            get: function (name) {
              return {
                provide: function (type, value, dependencyNames) {
                  called.push({
                    name:            name,
                    type:            type,
                    value:           value,
                    dependencyNames: dependencyNames
                  });
                }
              };
            }
          };

      dm = new Manager(container);

      function SomeClass1() {}

      SomeClass1.$depends = ['a', 'b'];

      function SomeClass2() {}

      dm.class('some1', SomeClass1);
      dm.class('some2', SomeClass2, ['c', 'd']);

      function getOther1() {}

      getOther1.$depends = ['a', 'b'];

      function getOther2() {}

      dm.factory('other1', getOther1);
      dm.factory('other2', getOther2, ['c', 'd']);

      called.should.have.length(4);
      called.should.eql([
        { name: 'some1', type: 'class', value: SomeClass1, dependencyNames: ['a', 'b'] },
        { name: 'some2', type: 'class', value: SomeClass2, dependencyNames: ['c', 'd'] },
        { name: 'other1', type: 'factory', value: getOther1, dependencyNames: ['a', 'b'] },
        { name: 'other2', type: 'factory', value: getOther2, dependencyNames: ['c', 'd'] }
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

    it('provides shorthand method for requesting dependencies as objects', function () {
      dm.object('some', 'other', 'another')
        .should.have.properties({
          some:    true,
          other:   true,
          another: true
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
          err.should.be.instanceof(Error).and.have.property('message', 'Dependency "fs" was not resolved in 100ms');
          called.catch = true;
        })
        .then(function () {
          called.catch.should.equal(true);
        });
    });
  });
});