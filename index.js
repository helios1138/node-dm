var Manager = require('./src/manager');
var Container = require('./src/container');
var dm = new Manager(new Container());

module.exports = dm;