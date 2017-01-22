'use strict';

const EventEmitter = require('events');
const muk = require('muk-prop');
const http = require('http');
const https = require('https');
const cp = require('child_process');
const semver = require('semver');
const thenify = require('thenify').withCallback;

const mock = module.exports = function mock() {
  return muk.apply(null, arguments);
};

exports = mock;

function getCallback(args) {
  let index = args.length - 1;
  let callback = args[index];
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

exports.isMocked = muk.isMocked;

/**
 * create an error instance
 *
 * @param  {String|Error} error - error
 * @param  {Object} props - props
 * @return {Error} error - error
 */
exports._createError = function(error, props) {
  if (!error) {
    error = new Error('mm mock error');
    error.name = 'MockError';
  }
  if (typeof error === 'string') {
    error = new Error(error);
    error.name = 'MockError';
  }
  props = props || {};
  for (const key in props) {
    error[key] = props[key];
  }

  return error;
};

/**
 * Mock async function error.
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {String|Error} error, error string message or error instance.
 * @param {Object} props, error properties
 * @param {Number} timeout, mock async callback timeout, default is 10.
 * @return {mm} this - mm
 */
exports.error = function(mod, method, error, props, timeout) {
  if (typeof props === 'number') {
    timeout = props;
    props = {};
  }
  error = exports._createError(error, props);

  if (timeout) {
    timeout = parseInt(timeout, 10);
  }
  timeout = timeout || 0;
  mock(mod, method, thenify(function() {
    const callback = getCallback(arguments);
    setTimeout(function() {
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
 * @param {Number} timeout, mock async callback timeout, default is 10.
 * @return {mm} this - mm
 */
exports.datas = function(mod, method, datas, timeout) {
  if (timeout) {
    timeout = parseInt(timeout, 10);
  }
  timeout = timeout || 0;
  if (!Array.isArray(datas)) {
    datas = [ datas ];
  }
  mock(mod, method, thenify(function() {
    const callback = getCallback(arguments);
    setTimeout(function() {
      callback.apply(mod, [ null ].concat(datas));
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
 * @param {Number} timeout, mock async callback timeout, default is 10.
 * @return {mm} this - mm
 */
exports.data = function(mod, method, data, timeout) {
  return exports.datas(mod, method, [ data ], timeout);
};

/**
 * mock return callback(null, null).
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {Number} [timeout], mock async callback timeout, default is 10.
 * @return {mm} this - mm
 */
exports.empty = function(mod, method, timeout) {
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
exports.syncError = function(mod, method, error, props) {
  error = exports._createError(error, props);
  mock(mod, method, function() {
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
exports.syncData = function(mod, method, data) {
  mock(mod, method, function() {
    return data;
  });
};

/**
 * mock function sync return nothing
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 */
exports.syncEmpty = function(mod, method) {
  exports.syncData(mod, method);
};

exports.http = {};
exports.https = {};

function getAgent(mod) {
  // 0.11.12 has change api back to 0.10.x
  return semver.satisfies(process.version, '>=0.11.0 <0.11.12') ? mod.globalAgent : mod;
}


function matchURL(options, params) {
  const url = params && params.url || params;
  const host = params && params.host;

  const pathname = options.path || options.pathname;
  const hostname = options.host || options.hostname;
  let match = false;
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
  const req = new EventEmitter();
  req.write = function() {};
  req.end = function() {};
  req.abort = function() {
    req._aborted = true;
    process.nextTick(function() {
      const err = new Error('socket hang up');
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
 * @return {mm} this - mm
 */
exports.http.request = function(url, data, headers, delay) {
  backupOriginalRequest(http);
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
 * @return {mm} this - mm
 */
exports.https.request = function(url, data, headers, delay) {
  backupOriginalRequest(https);
  return _request.call(this, https, url, data, headers, delay);
};

function backupOriginalRequest(mod) {
  if (!getAgent(mod).__sourceRequest) {
    getAgent(mod).__sourceRequest = getAgent(mod).request;
  }
}

function _request(mod, url, data, headers, delay) {
  headers = headers || {};
  if (delay) {
    delay = parseInt(delay, 10);
  }
  delay = delay || 0;
  getAgent(mod).request = function(options, callback) {
    let datas = [];
    let stream = null; // read stream
    if (typeof data.read === 'function') {
      stream = data;
    } else if (!Array.isArray(data)) {
      datas = [ data ];
    } else {
      for (let i = 0; i < data.length; i++) {
        datas.push(data[i]);
      }
    }

    const match = matchURL(options, url);
    if (!match) {
      return getAgent(mod).__sourceRequest(options, callback);
    }

    const req = mockRequest();

    if (callback) {
      req.on('response', callback);
    }

    let res;
    if (stream) {
      res = stream;
    } else {
      res = new EventEmitter();
      res.setEncoding = function(charset) {
        res.charset = charset;
      };
    }

    res.statusCode = headers.statusCode || 200;
    res.headers = omit(headers, 'statusCode');

    const ondata = function() {
      let chunk = datas.shift();
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

    setTimeout(function() {
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
exports.http.requestError = function(url, reqError, resError, delay) {
  backupOriginalRequest(http);
  _requestError.call(this, http, url, reqError, resError, delay);
};

/**
 * Mock https.request() error.
 * @param {String|RegExp} url, request url path.
 * @param {String|Error} reqError, request error.
 * @param {String|Error} resError, response error.
 * @param {Number} [delay], request error delay time, default is 10.
 */
exports.https.requestError = function(url, reqError, resError, delay) {
  backupOriginalRequest(https);
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
  getAgent(mod).request = function(options, callback) {
    const match = matchURL(options, url);
    if (!match) {
      return getAgent(mod).__sourceRequest(options, callback);
    }

    const req = mockRequest();

    if (callback) {
      req.on('response', callback);
    }

    setTimeout(function() {
      if (reqError) {
        return req.emit('error', reqError);
      }

      const res = new EventEmitter();
      res.statusCode = 200;
      res.headers = {
        server: 'MockMateServer',
      };
      process.nextTick(function() {
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
 * @param {String} stdout stdout
 * @param {String} stderr stderr
 * @param {Integer} timeout stdout/stderr/close event emit timeout
 */
exports.spawn = function(code, stdout, stderr, timeout) {
  const evt = new EventEmitter();
  mock(cp, 'spawn', function() {
    return evt;
  });
  setTimeout(function() {
    stdout && evt.emit('stdout', stdout);
    stderr && evt.emit('stderr', stderr);
    evt.emit('close', code);
    evt.emit('exit', code);
  }, timeout);
};

/**
 * remove all mock effects.
 * @return {mm} this - mm
 */
exports.restore = function() {
  if (getAgent(http).__sourceRequest) {
    getAgent(http).request = getAgent(http).__sourceRequest;
    getAgent(http).__sourceRequest = null;
  }
  if (getAgent(https).__sourceRequest) {
    getAgent(https).request = getAgent(https).__sourceRequest;
    getAgent(https).__sourceRequest = null;
  }
  muk.restore();
  return this;
};

function omit(obj, key) {
  const newObj = {};
  for (const k in obj) {
    if (k !== key) {
      newObj[k] = obj[k];
    }
  }
  return newObj;
}
