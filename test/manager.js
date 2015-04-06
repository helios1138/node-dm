'use strict';

require('should');

var Manager = require('../src/manager').Manager;

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
  });
});

/*it('notifies when dependency is requested but not resolved in some time', function () {
     var called = {
       catch: false
     };

     container.config({
       dependencyTimeout: 100
     });

     container.value('some', new Promise(function (resolve) {
       setTimeout(resolve.bind(null), 1000);
     }));

     return container.run('some')
       .catch(function (err) {
         err.should.be.instanceof(Error).and.have.property('message', 'Dependency "some" was not resolved in 100ms');
         called.catch = true;
       })
       .then(function () {
         called.catch.should.equal(true);
       });
   });*/