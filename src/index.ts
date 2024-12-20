import { EventEmitter } from 'node:events';
import http from 'node:http';
import https from 'node:https';
import cp from 'node:child_process';
import { scheduler } from 'node:timers/promises';
import { Readable, Duplex } from 'node:stream';
import { muk, isMocked, restore } from '@cnpmjs/muk-prop';
import is from 'is-type-of';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import thenify from 'thenify';

function mock(target: any, property: string, value?: any) {
  value = spyFunction(target, property, value);
  return muk(target, property, value);
}

function spyFunction(target: any, property: string, fn: any) {
  if (!is.function(fn)) return fn;
  // support mock with jest.fn()
  if (fn._isMockFunction && fn.mock) return fn;

  // don't allow mock async function to common function
  const isGenerator = is.generatorFunction(fn);
  const isAsyncLike = !isGenerator && isAsyncLikeFunction(target, property);
  return new Proxy(fn, {
    apply(target, thisArg, args) {
      fn.called = fn.called || 0;
      fn.calledArguments = fn.calledArguments || [];
      fn.calledArguments.push(args);
      fn.lastCalledArguments = args;
      fn.called++;
      const res = Reflect.apply(target, thisArg, args);
      if (isAsyncLike && !is.promise(res)) {
        throw new Error(`Can\'t mock async function to normal function for property "${property}"`);
      }
      return res;
    },
  });
}

function isAsyncLikeFunction(target: any, property: string) {
  // don't call getter
  // Object.getOwnPropertyDescriptor can't find getter in prototypes
  if (typeof target.__lookupGetter__ === 'function' && target.__lookupGetter__(property)) return false;
  return is.asyncFunction(target[property]) || is.generatorFunction(target[property]);
}

function getCallback(args: any[]) {
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

export type MockError = Error | string;

/**
 * create an error instance
 *
 * @param  {String|Error} error - error
 * @param  {Object} props - props
 * @return {Error} error - error
 */
function _createError(error?: MockError, props?: Record<string, any>): Error {
  if (!error) {
    error = new Error('mm mock error');
    error.name = 'MockError';
  }
  if (typeof error === 'string') {
    error = new Error(error);
    error.name = 'MockError';
  }
  Object.assign(error, props);
  return error;
}

function _mockError(mod: any, method: string, error?: MockError, props?: Record<string, any> | number,
  timeout?: number | string, once?: boolean) {
  if (typeof props === 'number') {
    timeout = props;
    props = {};
  }
  error = _createError(error, props);

  if (typeof timeout !== 'number') {
    timeout = parseInt(String(timeout || '0'), 10);
  }
  const isGeneratorFunction = is.generatorFunction(mod[method]);
  const isAsyncFunction = is.asyncFunction(mod[method]);
  if (isGeneratorFunction) {
    mock(mod, method, function* () {
      yield scheduler.wait(timeout);
      if (once) {
        restore();
      }
      throw error;
    });
  } else if (isAsyncFunction) {
    mock(mod, method, async function() {
      await scheduler.wait(timeout);
      if (once) {
        restore();
      }
      throw error;
    });
  }

  mock(mod, method, thenify.withCallback((...args: any[]) => {
    const callback = getCallback(args);
    setTimeout(() => {
      if (once) {
        restore();
      }
      callback(error);
    }, timeout);
  }));
}

/**
 * Mock async function error.
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {String|Error} error, error string message or error instance.
 * @param {Object} props, error properties
 * @param {Number} timeout, mock async callback timeout, default is 0.
 */
function mockError(mod: any, method: string, error?: MockError,
  props?: Record<string, any> | number,
  timeout?: number) {
  return _mockError(mod, method, error, props, timeout);
}

/**
 * Mock async function error once.
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {String|Error} error, error string message or error instance.
 * @param {Object} props, error properties
 * @param {Number} timeout, mock async callback timeout, default is 0.
 */
function errorOnce(mod: any, method: string, error?: MockError,
  props?: Record<string, any> | number,
  timeout?: number) {
  return _mockError(mod, method, error, props, timeout, true);
}

/**
 * mock return callback(null, data1, data2).
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {Array} datas, return datas array.
 * @param {Number} timeout, mock async callback timeout, default is 10.
 */
function mockDatas(mod: any, method: string, datas: any[] | any, timeout?: number) {
  if (timeout) {
    timeout = parseInt(String(timeout), 10);
  }
  timeout = timeout || 0;
  const isGeneratorFunction = is.generatorFunction(mod[method]);
  const isAsyncFunction = is.asyncFunction(mod[method]);
  if (isGeneratorFunction) {
    mock(mod, method, function* () {
      yield scheduler.wait(timeout);
      return datas;
    });
    return;
  } else if (isAsyncFunction) {
    mock(mod, method, async function() {
      await scheduler.wait(timeout);
      return datas;
    });
    return;
  }

  if (!Array.isArray(datas)) {
    datas = [ datas ];
  }
  mock(mod, method, thenify.withCallback((...args: any[]) => {
    const callback = getCallback(args);
    setTimeout(() => {
      callback.apply(mod, [ null ].concat(datas));
    }, timeout);
  }));
}

/**
 * mock return callback(null, data).
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {Object} data, return data.
 * @param {Number} timeout, mock async callback timeout, default is 0.
 */
function mockData(mod: any, method: string, data: any, timeout?: number) {
  const isGeneratorFunction = is.generatorFunction(mod[method]);
  const isAsyncFunction = is.asyncFunction(mod[method]);
  if (isGeneratorFunction || isAsyncFunction) {
    return mockDatas(mod, method, data, timeout);
  }
  return mockDatas(mod, method, [ data ], timeout);
}

function dataWithAsyncDispose(mod: any, method: string, data: any, timeout?: number) {
  data = {
    ...data,
    async [Symbol.asyncDispose]() {
      // do nothing
    },
  };
  return mockData(mod, method, data, timeout);
}

/**
 * mock return callback(null, null).
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {Number} [timeout], mock async callback timeout, default is 0.
 */
function mockEmpty(mod: any, method: string, timeout?: number) {
  return mockDatas(mod, method, [ null ], timeout);
}

/**
 * spy a function
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 */
function spy(mod: any, method: string) {
  if (typeof mod[method] !== 'function') {
    throw new Error(`spy target ${method} is not a function`);
  }
  const originalFn = mod[method];
  const wrap = function proxy(this: any, ...args: any[]) {
    return originalFn.apply(this, args);
  };
  mock(mod, method, wrap);
}

/**
 * mock function sync throw error
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {String|Error} error, error string message or error instance.
 * @param {Object} [props], error properties
 */
function syncError(mod: any, method: string, error?: MockError, props?: Record<string, any>) {
  error = _createError(error, props);
  mock(mod, method, () => {
    throw error;
  });
}

/**
 * mock function sync return data
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 * @param {Object} data, return data.
 */
function syncData(mod: any, method: string, data?: any) {
  mock(mod, method, () => {
    return data;
  });
}

/**
 * mock function sync return nothing
 *
 * @param {Object} mod, module object
 * @param {String} method, mock module object method name.
 */
function syncEmpty(mod: any, method: string) {
  return syncData(mod, method);
}

function matchURL(options: any, params: any) {
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
  const req = new Duplex({
    write() {},
    read() {},
  }) as any;
  req.abort = () => {
    req._aborted = true;
    process.nextTick(() => {
      const err = new Error('socket hang up');
      Reflect.set(err, 'code', 'ECONNRESET');
      req.emit('error', err);
    });
  };
  req.socket = { remoteAddress: '127.0.0.1' };
  return req;
}

export type RequestURL = string | RegExp | URL | object;
export type ResponseData = string | Buffer | Readable;

/**
 * Mock http.request().
 * @param {String|RegExp|Object} url, request url path.
 *   If url is Object, should be {url: $url, host: $host}
 * @param {String|Buffer|ReadStream} data, mock response data.
 *   If data is Array, then res will emit `data` event many times.
 * @param {Object} headers, mock response headers.
 * @param {Number} [delay], response delay time, default is 10.
 */
function mockHttpRequest(url: RequestURL, data: ResponseData, headers?: Record<string, any>, delay?: number) {
  backupOriginalRequest(http);
  return _request(http, url, data, headers, delay);
}

/**
 * Mock https.request().
 * @param {String|RegExp|Object} url, request url path.
 *   If url is Object, should be {url: $url, host: $host}
 * @param {String|Buffer|ReadStream} data, mock response data.
 *   If data is Array, then res will emit `data` event many times.
 * @param {Object} headers, mock response headers.
 * @param {Number} [delay], response delay time, default is 0.
 */
function mockHttpsRequest(url: RequestURL, data: ResponseData, headers?: Record<string, any>, delay?: number) {
  backupOriginalRequest(https);
  return _request(https, url, data, headers, delay);
}

function backupOriginalRequest(mod: any) {
  if (!mod.__sourceRequest) {
    mod.__sourceRequest = mod.request;
  }
  if (!mod.__sourceGet) {
    mod.__sourceGet = mod.get;
  }
}

function _request(mod: any, url: any, data: any, headers?: any, delay?: number) {
  headers = headers || {};
  if (delay) {
    delay = parseInt(String(delay), 10);
  }
  delay = delay || 0;

  // mod.get = function(options: any, callback: any) {
  //   const req = mod.request(options, callback);
  //   req.end();
  //   return req;
  // };
  mock(mod, 'get', function(options: any, callback: any) {
    const req = mod.request(options, callback);
    req.end();
    return req;
  });

  mock(mod, 'request', function(options: any, callback: any) {
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
      return mod.__sourceRequest(options, callback);
    }

    const req = mockRequest();

    if (callback) {
      req.on('response', callback);
    }

    let res: any;
    if (stream) {
      res = stream;
    } else {
      res = new Readable({
        read() {
          let chunk = datas.shift();
          if (!chunk) {
            if (!req._aborted) {
              this.push(null);
            }
            return;
          }

          if (!req._aborted) {
            if (typeof chunk === 'string') {
              chunk = Buffer.from(chunk);
            }
            if ('charset' in this && this.charset) {
              chunk = chunk.toString(this.charset);
            }
            this.push(chunk);
          }
        },
      });
      res.setEncoding = function(charset: string) {
        res.charset = charset;
      };
    }

    res.statusCode = headers.statusCode || 200;
    res.headers = omit(headers, 'statusCode');
    res.socket = req.socket;

    function sendResponse() {
      if (!req._aborted) {
        req.emit('response', res);
      }
    }

    if (delay) {
      setTimeout(sendResponse, delay);
    } else {
      setImmediate(sendResponse);
    }

    return req;
  });
}

/**
 * Mock http.request() error.
 * @param {String|RegExp} url, request url path.
 * @param {String|Error} reqError, request error.
 * @param {String|Error} resError, response error.
 * @param {Number} [delay], request error delay time, default is 0.
 */
function mockHttpRequestError(url: RequestURL, reqError?: MockError, resError?: MockError, delay?: number) {
  backupOriginalRequest(http);
  _requestError(http, url, reqError, resError, delay);
}

/**
 * Mock https.request() error.
 * @param {String|RegExp} url, request url path.
 * @param {String|Error} reqError, request error.
 * @param {String|Error} resError, response error.
 * @param {Number} [delay], request error delay time, default is 0.
 */
function mockHttpsRequestError(url: RequestURL, reqError?: MockError, resError?: MockError, delay?: number) {
  backupOriginalRequest(https);
  _requestError(https, url, reqError, resError, delay);
}

function _requestError(mod: any, url: any, reqError?: MockError, resError?: MockError, delay?: number) {
  if (delay) {
    delay = parseInt(String(delay), 10);
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

  mock(mod, 'get', function(options: any, callback: any) {
    const req = mod.request(options, callback);
    req.end();
    return req;
  });

  mock(mod, 'request', function(options: any, callback: any) {
    const match = matchURL(options, url);
    if (!match) {
      return mod.__sourceRequest(options, callback);
    }

    const req = mockRequest();

    if (callback) {
      req.on('response', callback);
    }

    setTimeout(function() {
      if (reqError) {
        return req.emit('error', reqError);
      }

      const res = new Duplex({
        read() {},
        write() {},
      }) as any;
      res.socket = req.socket;
      res.statusCode = 200;
      res.headers = {
        server: 'MockMateServer',
      };
      process.nextTick(() => {
        if (!req._aborted) {
          req.emit('error', resError);
        }
      });
      if (!req._aborted) {
        req.emit('response', res);
      }
    }, delay);

    return req;
  });
}

/**
 * mock child_process spawn
 * @param {Integer} code exit code
 * @param {String} stdout stdout
 * @param {String} stderr stderr
 * @param {Integer} timeout stdout/stderr/close event emit timeout
 */
function spawn(code: number, stdout: string, stderr: string, timeout: number = 0) {
  const evt = new EventEmitter();
  mock(cp, 'spawn', () => {
    return evt;
  });
  setTimeout(() => {
    stdout && evt.emit('stdout', stdout);
    stderr && evt.emit('stderr', stderr);
    evt.emit('close', code);
    evt.emit('exit', code);
  }, timeout);
}

function omit(obj: Record<string, any>, key: string) {
  const newObj: Record<string, any> = {};
  for (const k in obj) {
    if (k !== key) {
      newObj[k] = obj[k];
    }
  }
  return newObj;
}

/**
 * mock class method from instance
 */
function classMethod(instance: any, property: string, value?: any) {
  mock(instance.constructor.prototype, property, value);
}

const mockHttp = {
  request: mockHttpRequest,
  requestError: mockHttpRequestError,
};

const mockHttps = {
  request: mockHttpsRequest,
  requestError: mockHttpsRequestError,
};

// import { mm, restore } from 'mm';
export {
  isMocked,
  mock,
  mock as mm,
  mockDatas as datas,
  mockDatas,
  mockData as data,
  mockData,
  dataWithAsyncDispose,
  mockEmpty as empty,
  mockEmpty,
  mockError as error,
  mockError,
  spy,
  errorOnce,
  syncError,
  syncEmpty,
  syncData,
  mockHttp as http,
  mockHttps as https,
  spawn,
  restore,
  classMethod,
};

// import mm from 'mm';
export default Object.assign(mock, {
  isMocked,
  mock,
  mm: mock,
  datas: mockDatas,
  mockDatas,
  data: mockData,
  mockData,
  dataWithAsyncDispose,
  empty: mockEmpty,
  mockEmpty,
  error: mockError,
  mockError,
  spy,
  errorOnce,
  syncError,
  syncEmpty,
  syncData,
  http: mockHttp,
  https: mockHttps,
  spawn,
  restore,
  classMethod,
});

