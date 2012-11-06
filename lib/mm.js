/*!
 * mm - lib/mm.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var muk = require('muk');
var http = require('http');

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

exports.http = {};

var httpRequest = http.request;

function matchURL(options, url) {
  var pathname = options.path || options.pathname;
  var match = false;
  if (pathname) {
    if (typeof url === 'string') {
      match = pathname === url;
    } else {
      match = url.test(pathname);
    }
  }
  return match;
}

/**
 * Mock http.request().
 * @param {String|RegExp} url, request url path.
 * @param {String|Buffer} data, mock response data.
 *   If data is Array, then res will emit `data` event many times.
 * @param {Object} headers, mock response headers.
 * @param {Number} [delay], response delay time, default is 0.
 */
exports.http.request = function (url, data, headers, delay) {
  headers = headers || {};
  if (!Array.isArray(data)) {
    data = [data];
  }
  if (delay) {
    delay = parseInt(delay, 10);
  }
  delay = delay || 0;
  http.request = function (options, callback) {
    var match = matchURL(options, url);
    if (!match) {
      return httpRequest.call(http, options, callback);
    }

    var req = new EventEmitter();
    req.write = function () {};
    req.end = function () {};

    var res = new EventEmitter();
    res.headers = headers;
    var ondata = function () {
      var chunk = data.shift();
      if (!chunk) {
        return res.emit('end');
      }
      if (typeof chunk === 'string') {
        chunk = new Buffer(chunk);
      }
      res.emit('data', chunk);
      process.nextTick(ondata);
    };

    setTimeout(function () {
      callback(res);
      process.nextTick(ondata);
    }, delay);

    return req;
  };
  return this;
};

/**
 * Mock http.request() error.
 * @param {String|RegExp} url, request url path.
 * @param {String|Error} reqError, request error.
 * @param {String|Error} resError, response error.
 * @param {Number} [delay], request error delay time, default is 0.
 */
exports.http.requestError = function (url, reqError, resError, delay) {
  if (delay) {
    delay = parseInt(delay, 10);
  }
  delay = delay || 0;
  if (reqError && typeof reqError === 'string') {
    reqError = new Error(reqError);
    reqError.name = 'MockHttpRequestError';
  }
  if (resError && typeof resError === 'string') {
    resError = new Error(resError);
    resError.name = 'MockHttpResponseError';
  }
  http.request = function (options, callback) {
    var match = matchURL(options, url);
    if (!match) {
      return httpRequest.call(http, options, callback);
    }

    var req = new EventEmitter();
    req.write = function () {};
    req.end = function () {};
    
    if (callback) {
      req.on('response', callback);
    }

    setTimeout(function () {
      if (reqError) {
        return req.emit('error', reqError);
      }

      var res = new EventEmitter();
      res.statusCode = 200;
      res.headers = {
        server: 'MockMateServer'
      };
      process.nextTick(function () {
        req.emit('error', resError);
      });
      req.emit('response', res);
    }, delay);

    return req;
  };
  return this;
};