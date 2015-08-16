/*!
 * mm - test/foo.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

exports.get = function (query, callback, headers, cache) {
  process.nextTick(callback.bind(null, null, {
    query: query,
    headers: headers,
    cache: cache,
  }));
};

exports.check = function (callback, a1, a2) {
  process.nextTick(callback.bind(null, null, {
    a1: a1,
    a2: a2,
  }));
};

exports.query = function (callback) {
  process.nextTick(callback.bind(null, null, {
    result: 'result'
  }));
};

exports.getMultiValues = function (callback) {
  process.nextTick(callback.bind(null, null, 'a1', 'a2', 'a3'));
};

exports.mirror = function (input) {
  return input;
};
