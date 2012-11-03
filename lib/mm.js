/*!
 * mm - lib/mm.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var muk = require('muk');

/**
 * Mock async function error.
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {String|Error} error, error string message or error instance.
 * @param {Number} [tiemout], mock async callback timeout, default is 0.
 */
exports.error = function (mod, method, error, timeout) {
  if (typeof error === 'string') {
    error = new Error(error);
    error.name = 'MockError';
  }
  if (timeout) {
    timeout = parseInt(timeout, 10);
  }
  timeout = timeout || 0;
  muk(mod, method, function () {
    var callback = arguments[arguments.length - 1];
    setTimeout(function () {
      callback(error);
    }, timeout);
  });
  return this;
};

/**
 * remove all mock effects.
 */
exports.restore = function () {
  muk.restore();
  return this;
};