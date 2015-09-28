/**!
 * Copyright(c) node-modules and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var muk = require('muk');
var http = require('http');
var https = require('https');
var cp = require('child_process');
var semver = require('semver');
var thenify = require('thenify').withCallback;

var nodeMajorVersion = Number(process.versions.node.split('.')[0]);

var mockEnvs = {
  // key1: [val1, val2, ...]
};

var mock = module.exports = function mock(obj, key, method) {
  if (nodeMajorVersion < 4 && obj === process.env) {
    // hotfix for https://github.com/nodejs/node/pull/2999 on node<4.0.0
    // use empty string instead of undefined or null
    method = method || '';
    if (!mockEnvs[key]) {
      mockEnvs[key] = [];
    }
    mockEnvs[key].push(process.env[key]);
  }
  return muk.apply(null, arguments);
};

exports = mock;

function getCallback(args) {
  var index = args.length - 1;
  var callback = args[index];
  while (typeof callback !== 'function') {
    index--;
    if (index < 0) {
      break;
    }
    callback = args[index];
  }

  if (!callback) {
    throw new TypeError('Can\'t find callback function');
  }

  // support thunk fn(a1, a2, cb, cbThunk)
  if (typeof args[index - 1] === 'function') {
    callback = args[index - 1];
  }
  return callback;
}

/**
 * create an error instance
 *
 * @param  {String|Error} error
 * @param  {Object} props
 * @return {Error}
 */
exports._createError = function (error, props) {
  if (!error) {
    error = new Error('mm mock error');
    error.name = 'MockError';
  }
  if (typeof error === 'string') {
    error = new Error(error);
    error.name = 'MockError';
  }
  props = props || {};
  for (var key in props) {
    error[key] = props[key];
  }

  return error;
};

/**
 * Mock async function error.
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {String|Error} error, error string message or error instance.
 * @param {Object} [props], error properties
 * @param {Number} [tiemout], mock async callback timeout, default is 10.
 */
exports.error = function (mod, method, error, props, timeout) {
  if (typeof props === 'number') {
    timeout = props;
    props = {};
  }
  error = exports._createError(error, props);

  if (timeout) {
    timeout = parseInt(timeout, 10);
  }
  timeout = timeout || 0;
  mock(mod, method, thenify(function () {
    var callback = getCallback(arguments);
    setTimeout(function () {
      callback(error);
    }, timeout);
  }));
  return this;
};

/**
 * mock return callback(null, data1, data2).
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {Array} datas, return datas array.
 * @param {Number} [tiemout], mock async callback timeout, default is 10.
 */
exports.datas = function (mod, method, datas, timeout) {
  if (timeout) {
    timeout = parseInt(timeout, 10);
  }
  timeout = timeout || 0;
  if (!Array.isArray(datas)) {
    datas = [ datas ];
  }
  mock(mod, method, thenify(function () {
    var callback = getCallback(arguments);
    setTimeout(function () {
      callback.apply(mod, [null].concat(datas));
    }, timeout);
  }));
  return this;
};

/**
 * mock return callback(null, data).
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {Object} data, return data.
 * @param {Number} [tiemout], mock async callback timeout, default is 10.
 */
exports.data = function (mod, method, data, timeout) {
  return exports.datas(mod, method, [ data ], timeout);
};

/**
 * mock return callback(null, null).
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {Number} [tiemout], mock async callback timeout, default is 10.
 */
exports.empty = function (mod, method, timeout) {
  return exports.datas(mod, method, null, timeout);
};

/**
 * mock function sync throw error
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {String|Error} error, error string message or error instance.
 * @param {Object} [props], error properties
 */
exports.syncError = function (mod, method, error, props) {
  error = exports._createError(error, props);
  mock(mod, method, function () {
    throw error;
  });
};

/**
 * mock function sync return data
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {Object} data, return data.
 */
exports.syncData = function (mod, method, data) {
  mock(mod, method, function () {
    return data;
  });
};

/**
 * mock function sync return nothing
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 */
exports.syncEmpty = function (mod, method) {
  exports.syncData(mod, method);
};

exports.http = {};
exports.https = {};

function getAgent(mod) {
  // 0.11.12 has change api back to 0.10.x
  return semver.satisfies(process.version, '>=0.11.0 <0.11.12') ? mod.globalAgent : mod;
}

getAgent(http).__sourceRequest = getAgent(http).request;
getAgent(https).__sourceRequest = getAgent(https).request;

function matchURL(options, params) {
  var url = params && params.url || params;
  var host = params && params.host;

  var pathname = options.path || options.pathname;
  var hostname = options.host || options.hostname;
  var match = false;
  if (pathname) {
    if (!url) {
      match = true;
    } else if (typeof url === 'string') {
      match = pathname === url;
    } else if (url instanceof RegExp) {
      match = url.test(pathname);
    } else if (typeof host === 'string') {
      match = host === hostname;
    } else if (host instanceof RegExp) {
      match = host.test(hostname);
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
 * @param {String|RegExp|Object} url, request url path.
 *   If url is Object, should be {url: $url, host: $host}
 * @param {String|Buffer|ReadStream} data, mock response data.
 *   If data is Array, then res will emit `data` event many times.
 * @param {Object} headers, mock response headers.
 * @param {Number} [delay], response delay time, default is 10.
 */
exports.http.request = function (url, data, headers, delay) {
  return _request.call(this, http, url, data, headers, delay);
};

/**
 * Mock https.request().
 * @param {String|RegExp|Object} url, request url path.
 *   If url is Object, should be {url: $url, host: $host}
 * @param {String|Buffer|ReadStream} data, mock response data.
 *   If data is Array, then res will emit `data` event many times.
 * @param {Object} headers, mock response headers.
 * @param {Number} [delay], response delay time, default is 10.
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
  getAgent(mod).request = function (options, callback) {
    var datas = [];
    var stream = null; // read stream
    if (typeof data.read === 'function') {
      stream = data;
    } else if (!Array.isArray(data)) {
      datas = [data];
    } else {
      for (var i = 0; i < data.length; i++) {
        datas.push(data[i]);
      }
    }

    var match = matchURL(options, url);
    if (!match) {
      return getAgent(mod).__sourceRequest(options, callback);
    }

    var req = mockRequest();

    if (callback) {
      req.on('response', callback);
    }

    var res;
    if (stream) {
      res = stream;
    } else {
      res = new EventEmitter();
      res.setEncoding = function (charset) {
        res.charset = charset;
      };
    }
    res.statusCode = headers.statusCode || 200;
    delete headers.statusCode;

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
        if (stream) {
          return;
        }
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
 * @param {Number} [delay], request error delay time, default is 10.
 */
exports.http.requestError = function (url, reqError, resError, delay) {
  _requestError.call(this, http, url, reqError, resError, delay);
};

/**
 * Mock https.request() error.
 * @param {String|RegExp} url, request url path.
 * @param {String|Error} reqError, request error.
 * @param {String|Error} resError, response error.
 * @param {Number} [delay], request error delay time, default is 10.
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
  getAgent(mod).request = function (options, callback) {
    var match = matchURL(options, url);
    if (!match) {
      return getAgent(mod).__sourceRequest(options, callback);
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

/**
 * mock child_process spawn
 * @param {Integer} code exit code
 * @param {String} stdout
 * @param {String} stderr
 * @param {Integer} timeout stdout/stderr/close event emit timeout
 */
exports.spawn = function (code, stdout, stderr, timeout) {
  var evt = new EventEmitter();
  mock(cp, 'spawn', function () {
    return evt;
  });
  setTimeout(function () {
    stdout && evt.emit('stdout', stdout);
    stderr && evt.emit('stderr', stderr);
    evt.emit('close', code);
    evt.emit('exit', code);
  }, timeout);
};

/**
 * remove all mock effects.
 */
exports.restore = function () {
  getAgent(http).request = getAgent(http).__sourceRequest;
  getAgent(https).request = getAgent(https).__sourceRequest;
  muk.restore();

  for (var key in mockEnvs) {
    var values = mockEnvs[key];
    var firstValue = values[0];
    if (firstValue === undefined || firstValue === null) {
      process.env[key] = '';
    } else {
      process.env[key] = firstValue;
    }
  }
  mockEnvs = {};
  return this;
};
