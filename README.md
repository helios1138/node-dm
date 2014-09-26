<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [node-dm](#node-dm)
	- [Case study](#case-study)
- [Examples](#examples)
	- [Promises](#promises)
	- [Multiple dependencies](#multiple-dependencies)
- [Resources (the preferred API)](#resources-the-preferred-api)
	- [Resource State](#resource-state)
- [Other API](#other-api)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

node-dm
=======

Asynchronous Dependency Injection Manager for Node.JS

This library is designed to simplify module dependencies in you monolith JavaScript node.js application.
(Scroll down to **Resources** section to see the real and the best API).

Case study
-------

Your application consists of modules which depend on each other and usually initialize asynchronously.
For example a module *'restful-api-server'* requires another module *'database-provider'* to establish a connection
first, and only then allow the *'restful-api-server'* to open a listening port.
This is how `node-dm` solves the issue using callback style API.

First of all:
```JS
var dm = require('node-dm');
```

Inside the 'restful-api-server.js':

```JS
dm.get('database-provider', function (databaseProvider) {
  // Now you can start the server, open ports, do something with the databaseProvider, etc.
});
```

The 'database-provider.js':

```JS
mongo.connect('mongo://connection-string', function (err, state) {
  var databaseProvider = new DatabaseProvider();
  // ...
  dm.set('database-provider', databaseProvider);  
});
```

As the result no matter when the connection happened the server won't be started. It's all asynchronous.

Examples
========

There are other ways to provide and resolve dependencies.

Promises
--------

```JS
dm.set('resource-name', theResource);

dm.get('resource-name')
  .then(function (resource) {
    // this will not be invoked until the 'resource-name' became available.
  });
```

Multiple dependencies
---------------------

### Callback style

If you ask dependencies via array, you'll receive them via array.

```JS
dm.get(['dependency1', 'dependency2', 'dependency3'], function (dependency1, dependency2, dependency3) {
    // dependency1, and dependency2, and 'dependency3 are defined 
  });
```

If you ask dependencies via object, you'll receive them via object.

```JS
dm.get({'dependency1': true, 'dependency2': 'someState', 'dependency3:someState': true }, function (obj) {
    // obj.dependency1, and obj.dependency2, and obj.dependency3 are defined
  });
```

### Promise style

```JS
dm.get(['dependency1', 'dependency2'])
  .then(function (dependencies) {
    // dependencies[0] and dependencies[1] are defined
  });
```

Better promise style:

```JS
dm.get({'dependency1': true, 'dependency2': 'someState', 'dependency3:someState': true })
  .then(function (obj) {
    // obj.dependency1, and obj.dependency2, and obj.dependency3 are defined 
  });
```

Good promise style (using the `spread` function):

```JS
dm.get(['dependency1', 'dependency2'])
  .spread(function (dependency1, dependency2) {
    // dependency1 and dependency2 are defined
  });
```

Resources (the preferred API)
=============================

The real power of `node-dm` comes from *Resources*. See it in action.

Create a resource.
```JS
var resource = dm.resource('myResource');
```

Provide the resource object itself:
```JS
var myCoolResourceObject = {};
resource.provide(myCoolResourceObject);
```

Effectively the lines above equal to:
```JS
dm.set('myResource', myCoolResourceObject);
```

A resource can depend on other resources
```JS
dm.resource('resourceA')
  .depends(['resourceB', 'resourceC'], function(resourceB, resourceC){
    // this will be executed once B and C are provided
    // then you can provide A:
    dm.resource('resourceA').provide({ some: 'object' });
  })
```

Using `depends()` call you can also provide a resource simply by returning it
```JS
dm.resource('resourceA')
  .depends(['resourceB', 'resourceC'], function(resourceB, resourceC){
    return { some: 'object' }
  })
```

**But what's the point?**:
* Each resource can have `state` (like *connecting* and *connected*).
* It can `depend` on other resources and their states (like *database:connected*).
* DM keeps track of resources and their dependencies and makes sure there will be no circular dependencies
* It also will report which resources didn't get their dependencies for debugging purposes

Resource State
-----

Let's imagine our *database* resource have two states *connecting* and *connected*.
The *server* resource should be started after the *connected* state achieved.

```JS 
// === config.js ===
dm.resource('config').provide({ port: 31415 });

// === database.js ===
var mongo = require('mongo');
dm.resource('database').provide(mongo).setState('connecting');
mongo.connect('mongo://connectionString', function () {
  dm.resource('database').setState('connected');
});

// === server.js ===
dm.resource('server').depends(['database:connected', 'config'], function (database, config) {
  // we are sure that database is connected at this point of time
  var app = new express();
  express.listen(config.port);
  return app; // <- This object is the new 'server' resource.
});
```

As you can see the `server` resource depends on the `config` resource and the connected `database` resource (`'database:connected'`). The syntax for a resource state dependency is using semicolon `resource:state`.

Please note, everything is asynchronous as usual.

Please also note that the `server` resource is the `express` application object and can be `depend`ent on.

Also mind that exception will be thrown if you will try to define a resource that depends on another resource in a state, that it had in the past.

Other API
=========

You can always check if a dependency was already provided:

```JS
dm.isResolved('dependency');
```

You can get a state of a resource:

```JS
dm.resource('resourceName').getState();
```

You can get check if a resource was already declared (**do not confuse with provided**).
But why you would need that?

```JS
dm.getResource('resourceName'); // <- undefined if no resource has been declared yet, otherwise a Resource object
```
