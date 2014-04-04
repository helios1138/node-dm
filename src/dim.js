'use strict';

var q = require('q');

module.exports = function () {
  var
    container = {},
    subscribers = [];

  function resolveDependencies() {
    var
      provided = Object.keys(container),
      newSubscribers = [],
      toCall = [];

    subscribers.forEach(function (subscriber) {
      var
        missing = false,
        resolved = [];

      subscriber.dependencies.forEach(function (dependency) {
        if (provided.indexOf(dependency) === -1) {
          missing = true;
        }
        else {
          resolved.push(container[dependency]);
        }
      });

      if (!missing) {
        toCall.push(function () {
          if (typeof subscriber.callback === 'function') {
            var callResult = subscriber.callback.apply(this, resolved);
            subscriber.deferred.resolve(callResult);
          }
          else {
            subscriber.deferred.resolve(resolved);
          }
        });
      }
      else {
        newSubscribers.push(subscriber);
      }
    });

    subscribers = newSubscribers;

    toCall.forEach(function (callback) {
      callback();
    });
  }

  return {
    provide: function (name, dependency) {
      if (container[name]) {
        throw new Error('Resource "' + name + '" has already been provided');
      }

      container[name] = dependency;

      resolveDependencies();
    },

    depend: function () {
      var
        args = Array.prototype.slice.call(arguments),
        deferred = q.defer(),
        dependencies,
        callback;

      if (args.length === 1 && Array.isArray(args[0])) {
        args = args[0];
      }

      if (typeof args[args.length - 1] !== 'function') {
        args.push(null);
      }

      dependencies = args.slice(0, args.length - 1);
      callback = args[args.length - 1];

      subscribers.push({
        dependencies: dependencies,
        callback:     callback,
        deferred:     deferred
      });

      resolveDependencies();

      return deferred.promise;
    },

    get: function (dependencyName) {
      var deferred = q.defer();

      this.depend(dependencyName, function (dependency) {
        deferred.resolve(dependency);
      });

      return deferred.promise;
    },

    resource: function (name, resource) {
      var
        di = this,
        diResource = {
          dependencies: [],

          provide: function (resourceCallback) {
            di.depend(this.dependencies.concat([resourceCallback]))
              .then(function (resource) {
                di.provide(name, resource);
              });
            return this;
          },

          depend: function () {
            if (Array.isArray(arguments[0])) {
              this.dependencies = arguments[0];
            }
            else {
              this.dependencies = Array.prototype.slice.call(arguments);
            }
            return this;
          },

          setState: function (state) {
            di.get(name).then(function (resource) {
              di.provide(name + ':' + state, resource);
            });
            return this;
          }
        };

      if (resource !== undefined) {
        di.depend(resource)
          .then(function (result) {
            di.provide(name, result);
          });
      }

      return diResource;
    }
  };
};
