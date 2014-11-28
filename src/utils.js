'use strict';

module.exports = {
  parseName: function (name) {
    var parts = name.split(':');

    return {
      resource: parts[0],
      state: parts[1] || null
    };
  }
};