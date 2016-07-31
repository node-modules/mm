'use strict';

module.exports = require('./lib/mm');
const enable = require('enable');
if (enable.generator) {
  /* yup, ES6 */
  require('./lib/es6');
}
