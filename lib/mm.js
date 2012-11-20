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
var https = require('https');


exports = module.exports = function mock(obj, key, method) {
  return muk.apply(null, arguments);
};

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
exports.https = {};

http.__sourceRequest = http.request;
https.__sourceRequest = https.request;

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

function mockRequest() {
  var req = new EventEmitter();
  req.write = function () {};
  req.end = function () {};
  req.abort = function () {
    req._aborted = true;
    process.nextTick(function () {
      var err = new Error('socket hang up');
      err.code = 'ECONNRESET';
      req.emit('error', err);
    });
  };
  return req;
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
  return _request.call(this, http, url, data, headers, delay);
};

/**
 * Mock https.request().
 * @param {String|RegExp} url, request url path.
 * @param {String|Buffer} data, mock response data.
 *   If data is Array, then res will emit `data` event many times.
 * @param {Object} headers, mock response headers.
 * @param {Number} [delay], response delay time, default is 0.
 */
exports.https.request = function (url, data, headers, delay) {
  return _request.call(this, https, url, data, headers, delay);
};

function _request(mod, url, data, headers, delay) {
  headers = headers || {};
  if (delay) {
    delay = parseInt(delay, 10);
  }
  delay = delay || 0;
  mod.request = function (options, callback) {
    var datas = [];
    if (!Array.isArray(data)) {
      datas = [data];
    } else {
      for (var i = 0; i < data.length; i++) {
        datas.push(data[i]);
      }
    }

    var match = matchURL(options, url);
    if (!match) {
      return mod.__sourceRequest(options, callback);
    }

    var req = mockRequest();

    if (callback) {
      req.on('response', callback);
    }

    var res = new EventEmitter();
    res.setEncoding = function (charset) {
      res.charset = charset;
    };
    res.headers = headers;
    var ondata = function () {
      var chunk = datas.shift();
      if (!chunk) {
        if (!req._aborted) {
          res.emit('end');
        }
        return;
      }

      if (!req._aborted) {
        if (typeof chunk === 'string') {
          chunk = new Buffer(chunk);
        }
        if (res.charset) {
          chunk = chunk.toString(res.charset);
        }
        res.emit('data', chunk);
      }
      process.nextTick(ondata);
    };

    setTimeout(function () {
      if (!req._aborted) {
        req.emit('response', res);
        process.nextTick(ondata);
      }
    }, delay);

    return req;
  };
  return this;
}

/**
 * Mock http.request() error.
 * @param {String|RegExp} url, request url path.
 * @param {String|Error} reqError, request error.
 * @param {String|Error} resError, response error.
 * @param {Number} [delay], request error delay time, default is 0.
 */
exports.http.requestError = function (url, reqError, resError, delay) {
  _requestError.call(this, http, url, reqError, resError, delay);
};

/**
 * Mock https.request() error.
 * @param {String|RegExp} url, request url path.
 * @param {String|Error} reqError, request error.
 * @param {String|Error} resError, response error.
 * @param {Number} [delay], request error delay time, default is 0.
 */
exports.https.requestError = function (url, reqError, resError, delay) {
  _requestError.call(this, https, url, reqError, resError, delay);
};

function _requestError(mod, url, reqError, resError, delay) {
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
  mod.request = function (options, callback) {
    var match = matchURL(options, url);
    if (!match) {
      return mod.__sourceRequest(options, callback);
    }

    var req = mockRequest();
    
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
        if (!req._aborted) {
          req.emit('error', resError);
        }
      });
      if (!req._aborted) {
        req.emit('response', res);
      }
    }, delay);

    return req;
  };
  return this;
}