mm (美眉，Mock伴侣) [![Build Status](https://secure.travis-ci.org/fengmk2/mm.png)](http://travis-ci.org/fengmk2/mm) [![Coverage Status](https://coveralls.io/repos/fengmk2/mm/badge.png)](https://coveralls.io/r/fengmk2/mm)
=======

[![NPM](https://nodei.co/npm/mm.png?downloads=true&stars=true)](https://nodei.co/npm/mm)

![logo](https://raw.github.com/fengmk2/mm/master/logo.png)

mock mate, easy to mock `http` request, `fs` access and so on.

Mock伴侣，单元测试必备。

## Install

```bash
$ npm install mm
```

## Usage

### Mock `http(s).request()`

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

### Mock `http(s).request()` error

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

### Mock async function callback error

```js
var mm = require('mm');
var fs = require('fs');

mm.error(fs, 'readFile', 'mock fs.readFile return error');

fs.readFile('/etc/hosts', 'utf8', function (err, content) {
  console.log(err); // should return mock err: err.name === 'MockError'

  mm.restore(); // remove all mock effects.

  fs.readFile('/etc/hosts', 'utf8', function (err, content) {
    console.log(err); // should return null
    console.log(content); // should show the host list
  });
});
```

### Mock `callback(null, data)`

```js
mm.data(fs, 'readFile', new Buffer('some content'));
```

### Mock `callback(null, null)`

```js
mm.empty(mysql, 'query');
```

### Mock `callback(null, [data1, data2])`

```js
mm.datas(urllib, 'request', [new Buffer('data'), { headers: { foo: 'bar' } }]);
```

### use `mm` just like [`muk`](https://github.com/fent/node-muk)

```js
var fs = require('fs');
var mm = require('mm');

mm(fs, 'readFile', function (path, callback) {
  process.nextTick(callback.bind(null, null, 'file contents here'));
});
```

## Authors

```bash
$ git summary

 project  : mm
 repo age : 1 year, 2 months
 active   : 23 days
 commits  : 55
 files    : 16
 authors  :
    49  fengmk2                 89.1%
     4  dead-horse              7.3%
     1  AlsoTang                1.8%
     1  Alsotang                1.8%
```

## License

(The MIT License)

Copyright (c) 2012 - 2014 fengmk2 &lt;fengmk2@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
