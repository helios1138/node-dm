/*it('provides shorthand methods for defining dependencies', function () {
      container.get('some1').provide('value', { is: 'some1' });
      container.value('some2', { is: 'some2' });

      container.get('other1').provide('class', function Other1() { this.is = 'other1'; });
      container.class('other2', function Other2() { this.is = 'other2'; });

      container.get('another1').provide('factory', function getAnother1() { return { is: 'another1' }; });
      container.factory('another2', function getAnother2() { return { is: 'another2' }; });

      return container.resolve(['some1', 'some2', 'other1', 'other2', 'another1', 'another2'])
        .then(function (results) {
          results.should.have.length(6);
        });
    });

    it('provides shorthand methods for resolving the root dependency', function () {
      var called = {
        db:    false,
        app:   false,
        catch: false
      };

      function Db() {
        called.db = true;
      }


      function App() {
        called.app = true;
      }

      App.$depends = ['db'];

      container.class('db', Db)
        .class('app', App);

      return container.run('app')
        .catch(function (err) {
          called.catch = true;
        })
        .then(function () {
          called.should.have.properties({
            db:    true,
            app:   true,
            catch: false
          });
        });
    });*/



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