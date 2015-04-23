var Manager = require('./src/manager').Manager;
var Container = require('./src/container').Container;
var dm = new Manager(new Container());

module.exports = dm;