'use strict';

module.exports = require('./lib/mm');
var enable = require('enable');
if (enable.generator) {
  /* yup, ES6 */
  require('./lib/es6');
}
