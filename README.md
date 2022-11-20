mm
=======

[![NPM version][npm-image]][npm-url]
[![Node.js CI](https://github.com/node-modules/mm/actions/workflows/nodejs.yml/badge.svg)](https://github.com/node-modules/mm/actions/workflows/nodejs.yml)
[![Test coverage][codecov-image]][codecov-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/mm.svg?style=flat-square
[npm-url]: https://npmjs.org/package/mm
[codecov-image]: https://codecov.io/github/node-modules/mm/coverage.svg?branch=master
[codecov-url]: https://codecov.io/github/node-modules/mm?branch=master
[download-image]: https://img.shields.io/npm/dm/mm.svg?style=flat-square
[download-url]: https://npmjs.org/package/mm

An simple but flexible **mock(or say stub)** package, mock mate.

## Install

```bash
$ npm install mm --save-dev
```

## Usage

```js
var mm = require('mm');
var fs = require('fs');

mm(fs, 'readFileSync', function(filename) {
  return filename + ' content';
});

console.log(fs.readFileSync('《九评 Java》'));
// => 《九评 Java》 content

mm.restore();

console.log(fs.readFileSync('《九评 Java》'));
// => throw `Error: ENOENT, no such file or directory '《九评 Java》`
```

### Support spy

If mocked property is a function, it will be spied, every time it called, mm will modify `.called`, `.calledArguments` and `.lastCalledArguments`. For example:

```js
const target = {
  async add(a, b) {
    return a + b;
  },
};

mm.data(target, 'add', 3);

assert.equal(await target.add(1, 1), 3);
assert.equal(target.add.called, 1);
assert.deepEqual(target.add.calledArguments, [[ 1, 1 ]]);
assert.deepEqual(target.add.lastCalledArguments, [ 1, 1 ]);

assert.equal(await target.add(2, 2), 3);
assert.equal(target.add.called, 2);
assert.deepEqual(target.add.calledArguments, [[ 1, 1 ], [ 2, 2 ]]);
assert.deepEqual(target.add.lastCalledArguments, [ 2, 2 ]);
```

If you only need spy and don't need mock, you can use `mm.spy` method directly:

```js
const target = {
  async add(a, b) {
    await this.foo();
    return a + b;
  },
  async foo() { /* */ },
};

mm.spy(target, 'add');
assert.equal(await target.add(1, 1), 2);
assert.equal(target.add.called, 1);
assert.deepEqual(target.add.calledArguments, [[ 1, 1 ]]);
assert.deepEqual(target.add.lastCalledArguments, [ 1, 1 ]);

assert.equal(await target.add(2, 2), 4);
assert.equal(target.add.called, 2);
assert.deepEqual(target.add.calledArguments, [[ 1, 1 ], [ 2, 2 ]]);
assert.deepEqual(target.add.lastCalledArguments, [ 2, 2 ]);
```

## API

### .error(module, propertyName, errerMessage, errorProperties)

```js
var mm = require('mm');
var fs = require('fs');

mm.error(fs, 'readFile', 'mock fs.readFile return error');

fs.readFile('/etc/hosts', 'utf8', function (err, content) {
  // err.name === 'MockError'
  // err.message === 'mock fs.readFile return error'
  console.log(err);

  mm.restore(); // remove all mock effects.

  fs.readFile('/etc/hosts', 'utf8', function (err, content) {
    console.log(err); // => null
    console.log(content); // => your hosts
  });
});
```

### .errorOnce(module, propertyName, errerMessage, errorProperties)

Just like `mm.error()`, but only mock error once.

```js
const mm = require('mm');
const fs = require('fs');

mm.errorOnce(fs, 'readFile', 'mock fs.readFile return error');

fs.readFile('/etc/hosts', 'utf8', function (err, content) {
  // err.name === 'MockError'
  // err.message === 'mock fs.readFile return error'
  console.log(err);

  fs.readFile('/etc/hosts', 'utf8', function (err, content) {
    console.log(err); // => null
    console.log(content); // => your hosts
  });
});
```

### .data(module, propertyName, secondCallbackArg)

```js
mm.data(fs, 'readFile', new Buffer('some content'));

// equals

fs.readFile = function (...args, callback) {
  callback(null, new Buffer('some content'))
};
```

### .empty(module, propertyName)

```js
mm.empty(mysql, 'query');

// equals

mysql.query = function (...args, callback) {
  callback();
}
```

### .datas(module, propertyName, argsArray)

```js
mm.datas(urllib, 'request', [new Buffer('data'), {headers: { foo: 'bar' }}]);

// equals

urllib.request = function (...args, callback) {
  callback(null, new Buffer('data'), {headers: { foo: 'bar' }});
}
```

### .syncError(module, propertyName, errerMessage, errorProperties)

```js
var mm = require('mm');
var fs = require('fs');

mm.syncError(fs, 'readFileSync', 'mock fs.readFile return error', {code: 'ENOENT'});

// equals

fs.readFileSync = function (...args) {
  var err = new Error('mock fs.readFile return error');
  err.code = 'ENOENT';
  throw err;
};

```

### .syncData(module, propertyName, value)

```js
mm.syncData(fs, 'readFileSync', new Buffer('some content'));

// equals

fs.readFileSync = function (...args) {
  return new Buffer('some content');
};
```

### .syncEmpty

```js
mm.syncEmpty(fs, 'readFileSync');

// equals

fs.readFileSync = function (...args) {
  return;
}
```

### .restore()

```js
// restore all mock properties
mm.restore();
```

### .http.request(mockUrl, mockResData, mockResHeaders) and .https.request(mockUrl, mockResData, mockResHeaders)

```js
var mm = require('mm');
var http = require('http');

var mockURL = '/foo';
var mockResData = 'mock data';
var mockResHeaders = { server: 'mock server' };
mm.http.request(mockURL, mockResData, mockResHeaders);
mm.https.request(mockURL, mockResData, mockResHeaders);

// http
http.get({
  path: '/foo'
}, function (res) {
  console.log(res.headers); // should be mock headers
  var body = '';
  res.on('data', function (chunk) {
    body += chunk.toString();
  });
  res.on('end', function () {
    console.log(body); // should equal 'mock data'
  });
});

// https
https.get({
  path: '/foo'
}, function (res) {
  console.log(res.headers); // should be mock headers
  var body = '';
  res.on('data', function (chunk) {
    body += chunk.toString();
  });
  res.on('end', function () {
    console.log(body); // should equal 'mock data'
  });
});
```

### .http.requestError(mockUrl, reqError, resError) and .https.requestError(mockUrl, reqError, resError)

```js
var mm = require('mm');
var http = require('http');

var mockURL = '/foo';
var reqError = null;
var resError = 'mock res error';
mm.http.requestError(mockURL, reqError, resError);

var req = http.get({
  path: '/foo'
}, function (res) {
  console.log(res.statusCode, res.headers); // 200 but never emit `end` event
  res.on('end', fucntion () {
    console.log('never show this message');
  });
});
req.on('error', function (err) {
  console.log(err); // should return mock err: err.name === 'MockHttpResponseError'
});
```

### .classMethod(instance, method, mockMethod)

```js
class Foo {
  async fetch() {
    return 1;
  }
}

const foo = new Foo();
const foo1 = new Foo();

mm.classMethod(foo, 'fetch', async () => {
  return 3;
});
assert(await foo.fetch() === 3);
assert(await foo1.fetch() === 3);
```

## License

[MIT](LICENSE)
