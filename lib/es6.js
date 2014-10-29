/**!
 * mm - lib/es6.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var is = require('is-type-of');
var sleep = require('co-sleep');
var mm = require('./mm');

var mockDatas = mm.datas;
// support generator
mm.datas = function (mod, method, datas, timeout) {
  if (!is.generatorFunction(mod[method])) {
    return mockDatas.call(mm, mod, method, datas, timeout);
  }

  if (timeout) {
    timeout = parseInt(timeout, 10);
  }
  timeout = timeout || 0;
  mm(mod, method, function* () {
    yield sleep(timeout);
    return datas;
  });
  return this;
};

var mockData = mm.data;
mm.data = function (mod, method, data, timeout) {
  if (!is.generatorFunction(mod[method])) {
    return mockData.call(mm, mod, method, data, timeout);
  }

  return mm.datas(mod, method, data, timeout);
};

var mockError = mm.error;
mm.error = function (mod, method, error, timeout) {
  if (!is.generatorFunction(mod[method])) {
    return mockError.call(mm, mod, method, error, timeout);
  }

  if (!error) {
    error = new Error('mm mock error');
    error.name = 'MockError';
  }
  if (typeof error === 'string') {
    error = new Error(error);
    error.name = 'MockError';
  }
  if (timeout) {
    timeout = parseInt(timeout, 10);
  }
  timeout = timeout || 0;
  mm(mod, method, function* () {
    yield sleep(timeout);
    throw error;
  });
  return this;
};
