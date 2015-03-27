Node DM
-------
####Asynchronous Dependency Manager for Node.JS

> A simple library to handle dependencies in your app. 
 - resources can be provided in any order and time (hence the asynchronousity)
 - instances are created only when they are needed (being depended upon)
 - internally relies on promises
 - will notify you of missing dependencies
 - will check for circular dependencies 

```sh
npm install node-dm
```

```js
var dm = require('node-dm');
```

optional config
```js
/* will reject dependencies that were not resolved after a period of time */
dm.config({ dependencyTimeout: 5000 });
```

Short demo
----------

app.js
```js
function App(db, config){
	/* get your dependencies */
	this.db = db;
	this.config = config;
}

/* define what dependencies your resource needs */
App.$depends = ['db', 'config'];

/* provide your resource as a class */
dm.class('app', App);

/* 
 * bootstrap dependency tree - calling dm.run() is needed to instatiate
 * the root dependency, which nobody depends upon 
 */
dm.run('app')
  .catch(function(err){
    /* 
     * because internally node dm uses promises, all the rejections/exceptions
     * eventually can be caught on the topmost node of dependency tree
     */
    console.error(err.stack);
  });
```

db.js
```js
function connectToDb(config){
    /* 
     * we return a promise, so whoever depends on 'db', will receive it
     * once the connection has beed established
     */
    return new Promise(function(resolve, reject){
        MongoClient.connect(config.mongo, function(err, db){
            if(err){
                reject(err);
            }
            else{
                resolve(db);
            }
        });
    });
}

connectToDb.$depends = ['config'];

/* provide your resource as a factory function, that returns what you need (or the promise of that) */
dm.factory('db', connectToDb);
```

config.js
```js
var dm = require('node-dm');

var config = {
	mongo: 'mongodb://localhost:27017/mydb'
};

/* this resource is a simple value and does not need instantiation; can also be a promise */
dm.value('config', config);
```

Api
---

define your resources:

* as simple values of any kind

```js
var config = {
	this: {
	    is: 'config'
	}
}

/* full method */
dm.provide('value', 'config', config);
/* shorthand method: */
dm.value('pi', 3.14);

/* promises will also work */
var timeIn10Sec = new Promise(function(resolve){
	setTimeout(function(){
		resolve(new Date());
	}, 1000);
});

/* whoever depends on this, will receive it once the promise will be resolved */
dm.value('timeIn10Sec', timeIn10Sec);
```

* as classes

```js
function UserCtrl(config, db){
	/* you will receive dependencies you requested */
	this.config = config;
	this.db = db;
}

UserCtrl.$depends = ['config', 'db'];

/* full method */
dm.provide('class', 'userCtrl', UserCtrl);

/* wokrs with ES6 too */
class FileParser{
	static get $depends(){ return ['config', 'db']; }

	constructor(config, db){
		this.config = config;
		this.db = db;
	}
}

/* shorthand method */
dm.class('fileParser', FileParser);
```

* as factory functions

```js
function createObject(){
	return {
		this: { is: 'object' }
	}
}

/* full method */
dm.provide('factory', 'someObject', createObject);

/* a function can also return a promise */
function connectToDb(config){
	return new Promise(function(resolve, reject){
		MongoClient.connect(config.mongo, function(err, db){
			if(err){
				reject(err);
			}
			else{
				resolve(db);
			}
		});
	});
}

connectToDb.$depends = ['config'];

/* shorthand method: */
dm.factory('db', connectToDb);
```

alternatively, dependencies of a resource can be requests as an object
```js
function Parser(deps){
	/* you will receive your dependencies as an object */
	this.deps = deps;
	this.is = 'awesome parser';
}

Parser.prototype.parse = function(){
	if(this.deps.config.canIDoStuff){
		this.deps.db.doSomething();
		this.deps.router.makeEverythingGood();
	}
};

Parser.$depends = { 
	config: true,
	db: true,
	router: true
};

dm.class('parser', Parser);
```
