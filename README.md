mm [![Build Status](https://travis-ci.org/node-modules/mm.svg?branch=master)](https://travis-ci.org/node-modules/mm)
=======

An simple but flexible **mock(or say stub)** package

## Install

```bash
$ npm install mm
```

## Usage

```js
var mm = require('mm');
var fs = require('fs');

mm(fs, 'readFileSync', function (filename) {
  return filename + ' content';
});

console.log(fs.readFileSync('《九评 Java》'));
// => 《九评 Java》 content

mm.restore();

console.log(fs.readFileSync('《九评 Java》'));
// => throw `Error: ENOENT, no such file or directory '《九评 Java》`
```

## API

### .error(module, propertyName, errerMessage)

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

### .data(module, propertyName, secondCallbackArg)

```js
mm.data(fs, 'readFile', new Buffer('some content'));

// equals

fs.readFile = function (args..., callback) {
  callback(null, new Buffer('some content'))
};
```

### .emply(module, propertyName)

```js
mm.empty(mysql, 'query');

// equals

mysql.query = function (args..., callback) {
  callback();
}
```

### .datas(module, propertyName, argsArray)

```js
mm.datas(urllib, 'request', [new Buffer('data'), {headers: { foo: 'bar' }}]);

// equals

urllib.request = function (args..., callback) {
  callback(null, new Buffer('data'), {headers: { foo: 'bar' }});
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

### .http.requestError(mockUrl, reqError, resError)

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
}
```

## Authors

* fengmk2 <https://github.com/fengmk2>
* dead-horse <https://github.com/dead-horse>
* alsotang <https://github.com/alsotang>

## License

MIT
