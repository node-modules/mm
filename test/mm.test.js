/**!
 * mm - test/mm.test.js
 *
 * Copyright(c) 2012 - 2014 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var path = require('path');
var fs = require('fs');
var should = require('should');
var http = require('http');
var https = require('https');
var child_process = require('child_process');
var pedding = require('pedding');
var ChunkStream = require('chunkstream');
var mm = require('../');
var foo = require('./foo');
var thunkify = require('thunkify-wrap');

describe('mm.test.js', function () {

  var port = null;
  var sslPort = null;

  before(function (done) {
    done = pedding(2, done);

    var app = http.createServer(function (req, res) {
      res.end(req.method + ' ' + req.url);
    });
    app.listen(0, function () {
      port = app.address().port;
      done();
    });

    var fixtures = path.join(__dirname, 'fixtures');
    var appssl = https.createServer({
      key: fs.readFileSync(path.join(fixtures, 'test_key.pem')),
      cert: fs.readFileSync(path.join(fixtures, 'test_cert.pem'))
    }, function (req, res) {
      res.end(req.method + ' ' + req.url);
    });
    appssl.listen(0, function () {
      sslPort = appssl.address().port;
      done();
    });
  });

  afterEach(function () {
    mm.restore();
  });

  describe('datas(), data(), empty()', function () {
    it('should mock foo.getMultiValues() return `b1, b2, b3`', function (done) {
      mm.datas(foo, 'getMultiValues', [ 'b1', 'b2', 'b3' ]);
      foo.getMultiValues(function (err, a1, a2, a3) {
        should.not.exist(err);
        a1.should.equal('b1');
        a2.should.equal('b2');
        a3.should.equal('b3');
        done();
      });
    });

    it('should mock foo.getMultiValues() return `b1, b2, b3` with timeout', function (done) {
      mm.datas(foo, 'getMultiValues', [ 'b1', 'b2', 'b3' ], 10);
      foo.getMultiValues(function (err, a1, a2, a3) {
        should.not.exist(err);
        a1.should.equal('b1');
        a2.should.equal('b2');
        a3.should.equal('b3');
        done();
      });
    });

    it('should mock foo.getMultiValues() return `b1`', function (done) {
      mm.datas(foo, 'getMultiValues', [ 'b1' ]);
      foo.getMultiValues(function (err, a1, a2, a3) {
        should.not.exist(err);
        a1.should.equal('b1');
        should.not.exist(a2);
        should.not.exist(a3);
        done();
      });
    });

    it('should mock foo.getMultiValues() with "b1" return `b1`', function (done) {
      mm.datas(foo, 'getMultiValues', 'b1');
      foo.getMultiValues(function (err, a1, a2, a3) {
        should.not.exist(err);
        a1.should.equal('b1');
        should.not.exist(a2);
        should.not.exist(a3);
        done();
      });
    });

    it('should mock foo.getMultiValues() using data("b1")', function (done) {
      mm.data(foo, 'getMultiValues', 'b1');
      foo.getMultiValues(function (err, a1, a2, a3) {
        should.not.exist(err);
        a1.should.equal('b1');
        should.not.exist(a2);
        should.not.exist(a3);
        done();
      });
    });

    it('should mock foo.get() return [b1, b2]', function (done) {
      mm.data(foo, 'get', [ 'b1', 'b2' ]);
      foo.get('q1', function (err, data) {
        should.not.exist(err);
        data.should.eql([ 'b1', 'b2' ]);
        done();
      });
    });

    it('should mock foo.get() twice return [b1, b2]', function (done) {
      mm.data(foo, 'get', [ 'b1', 'b2' ]);
      var done = pedding(2, done);
      foo.get('q1', function (err, data) {
        should.not.exist(err);
        data.should.eql([ 'b1', 'b2' ]);
        done();
      });
      foo.get('q1', function (err, data) {
        should.not.exist(err);
        data.should.eql([ 'b1', 'b2' ]);
        done();
      });
    });

    it('should mock foo.get() return empty', function (done) {
      mm.empty(foo, 'get');
      foo.get('q1', function (err, data) {
        should.not.exist(err);
        should.not.exist(data);
        done();
      });
    });

  });

  describe('error()', function () {
    it('should mock fs.readFile return error', function (done) {
      mm.error(fs, 'readFile', 'can not read file');
      fs.readFile('/etc/hosts', 'utf8', function (err, data) {
        should.exist(err);
        err.name.should.equal('MockError');
        err.message.should.equal('can not read file');
        should.not.exist(data);

        mm.restore();

        fs.readFile('/etc/hosts', 'utf8', function (err, data) {
          should.not.exist(err);
          should.exist(data);
          data.should.containEql('127.0.0.1');
          done();
        });

      });
    });

    it('should mock error with Error instance', function (done) {
      var err = new Error('mock error instance');
      err.name = 'CustomError';
      mm.error(fs, 'readFile', err);
      fs.readFile('/etc/hosts', 'utf8', function (err, data) {
        should.exist(err);
        err.name.should.equal('CustomError');
        err.message.should.equal('mock error instance');
        should.not.exist(data);
        done();
      });
    });

    it('should mock error with empty error', function (done) {
      mm.error(fs, 'readFile');
      fs.readFile('/etc/hosts', 'utf8', function (err, data) {
        should.exist(err);
        err.name.should.equal('MockError');
        err.message.should.equal('mm mock error');
        should.not.exist(data);
        done();
      });
    });

    it('should mock error with 500ms timeout', function (done) {
      mm.error(fs, 'readFile', '500ms timeout', 500);
      var start = Date.now();
      fs.readFile('/etc/hosts', 'utf8', function (err, data) {
        var use = Date.now() - start;
        should.exist(err);
        err.name.should.equal('MockError');
        err.message.should.equal('500ms timeout');
        should.not.exist(data);
        use.should.above(490);
        done();
      });
    });

    it.skip('should work for callback is not the last params case', function (done) {
      var foo = require('./foo');
      done = pedding(3, done);

      mm.error(foo, 'get', 'mock foo.get error');
      foo.get('q1', function (err, data) {
        should.exist(err);
        err.message.should.equal('mock foo.get error');
        should.not.exist(data);
        done();
      });

      foo.get('q2', function (err, data) {
        should.exist(err);
        err.message.should.equal('mock foo.get error');
        should.not.exist(data);
        done();
      }, { h1: 'h1' }, false);

      mm.error(foo, 'check', 'mock foo.check error');
      foo.check(function (err, data) {
        should.exist(err);
        err.message.should.equal('mock foo.check error');
        should.not.exist(data);
        done();
      }, { h1: 'h1' }, false);
    });

    it.skip('should throw error', function () {
      var foo = require('./foo');
      mm.error(foo, 'query', 'mock foo.check error');
      (function () {
        foo.query();
      }).should.throw('Can\'t find callback function');
    });

  });

  describe('http(s).request()', function () {
    ['http', 'https'].forEach(function (modName) {
      var mod = modName === 'http' ? http : https;

      it('should mock ' + modName + '.request() response with string url', function (done) {
        var modPort = modName === 'http' ? port : sslPort;

        done = pedding(2, done);

        var mockURL = '/foo';
        var mockResData = 'mock data';
        var mockResHeaders = { server: 'mock server' };
        mm[modName].request(mockURL, mockResData, mockResHeaders);

        mod.get({
          host: '127.0.0.1',
          port: modPort,
          rejectUnauthorized: false,
          path: '/foo'
        }, function (res) {
          res.headers.should.eql(mockResHeaders);
          var body = '';
          res.on('data', function (chunk) {
            body += chunk.toString();
          });
          res.on('end', function () {
            body.should.equal(mockResData);
            done();
          });
        });

        // not match /foo
        mod.get({
          host: '127.0.0.1',
          port: modPort,
          rejectUnauthorized: false,
          path: '/'
        }, function (res) {
          res.headers.should.not.eql(mockResHeaders);
          var body = '';
          res.on('data', function (chunk) {
            body += chunk.toString();
          });
          res.on('end', function () {
            body.should.not.equal(mockResData);
            done();
          });
        });

      });

      it('should mock ' + modName + '.request() response with regex url', function (done) {
        var mockURL = /foo$/;
        var mockResData = 'mock data with regex url';
        var mockResHeaders = { server: 'mock server' };
        mm[modName].request(mockURL, mockResData, mockResHeaders);

        done = pedding(2, done);

        mod.get({
          host: 'cnodejs.org',
          path: '/bar/foo'
        }, function (res) {
          res.headers.should.eql(mockResHeaders);
          var body = '';
          res.on('data', function (chunk) {
            body += chunk.toString();
          });
          res.on('end', function () {
            body.should.equal(mockResData);
            done();
          });
        });

        mod.get({
          host: 'cnodejs.org',
          path: '/bar2/foo'
        }, function (res) {
          res.headers.should.eql(mockResHeaders);
          var body = '';
          res.on('data', function (chunk) {
            should.ok(Buffer.isBuffer(chunk));
            body += chunk.toString();
          });
          res.on('end', function () {
            body.should.equal(mockResData);
            done();
          });
        });

      });

      it('should mock ' + modName + '.request() 500ms response delay', function (done) {
        var mockURL = /foo$/;
        var mockResData = [ 'mock data with regex url', '哈哈' ];
        var mockResHeaders = { server: 'mock server' };
        mm[modName].request(mockURL, mockResData, mockResHeaders, 500);

        var start = Date.now();
        mod.get({
          host: 'cnodejs.org',
          path: '/bar/foo'
        }, function (res) {
          res.headers.should.eql(mockResHeaders);
          res.setEncoding('utf8');
          var body = '';
          res.on('data', function (chunk) {
            chunk.should.be.a.String;
            body += chunk;
          });
          res.on('end', function () {
            var use = Date.now() - start;
            body.should.equal(mockResData.join(''));
            use.should.above(490);
            done();
          });
        });
      });

      it('should mock ' + modName + '.request({url: "/bar/foo"}) 500ms response delay', function (done) {
        var mockResData = [ 'mock data with regex url', '哈哈' ];
        var mockResHeaders = { server: 'mock server' };
        mm[modName].request({url: '/bar/foo'}, mockResData, mockResHeaders, 500);

        var start = Date.now();
        mod.get({
          host: 'cnodejs.org',
          path: '/bar/foo'
        }, function (res) {
          res.headers.should.eql(mockResHeaders);
          res.setEncoding('utf8');
          var body = '';
          res.on('data', function (chunk) {
            chunk.should.be.a.String;
            body += chunk;
          });
          res.on('end', function () {
            var use = Date.now() - start;
            body.should.equal(mockResData.join(''));
            use.should.above(490);
            done();
          });
        });
      });

      it.skip('should mock ' + modName + '.request({url: "/bar/foo"}) with stream 500ms response delay',
      function (done) {
        var mockResData = new ChunkStream([ 'mock data with regex url', '哈哈' ]);
        var mockResHeaders = { server: 'mock server' };
        mm[modName].request({url: '/bar/foo'}, mockResData, mockResHeaders, 500);

        var start = Date.now();
        mod.get({
          host: 'npmjs.org',
          path: '/bar/foo'
        }, function (res) {
          res.headers.should.eql(mockResHeaders);
          res.setEncoding('utf8');
          var body = '';
          res.on('data', function (chunk) {
            chunk.should.be.a.String;
            body += chunk;
          });
          res.on('end', function () {
            var use = Date.now() - start;
            body.should.equal([ 'mock data with regex url', '哈哈' ].join(''));
            use.should.above(490);
            done();
          });
        });
      });

      it('should mock ' + modName + '.request({url: "/bar/foo"}) with fs readstream no response delay',
      function (done) {
        var mockResData = fs.createReadStream(__filename);
        var mockResHeaders = { server: 'mock server', statusCode: 201 };
        mm[modName].request('', mockResData, mockResHeaders);

        var start = Date.now();
        mod.get({
          host: 'npmjs.org',
          path: '/bar/foo'
        }, function (res) {
          res.should.status(201);
          res.headers.should.eql(mockResHeaders);
          res.setEncoding('utf8');
          var body = '';
          res.on('data', function (chunk) {
            chunk.should.be.a.String;
            body += chunk;
          });
          res.on('end', function () {
            var use = Date.now() - start;
            body.should.equal(fs.readFileSync(__filename, 'utf8'));
            done();
          });
        });
      });

      it('should mock ' + modName + '.request({host: "cnodejs.org"}) 500ms response delay', function (done) {
        var mockResData = [ 'mock data with regex url', '哈哈' ];
        var mockResHeaders = { server: 'mock server' };
        mm[modName].request({host: "cnodejs.org"}, mockResData, mockResHeaders, 500);

        var start = Date.now();
        mod.get({
          host: 'cnodejs.org',
          path: '/bar/foo'
        }, function (res) {
          res.headers.should.eql(mockResHeaders);
          res.setEncoding('utf8');
          var body = '';
          res.on('data', function (chunk) {
            chunk.should.be.a.String;
            body += chunk;
          });
          res.on('end', function () {
            var use = Date.now() - start;
            body.should.equal(mockResData.join(''));
            use.should.above(490);
            done();
          });
        });
      });

      it('should mock ' + modName + '.request({host: /cnodejs/}) 500ms response delay', function (done) {
        var mockResData = [ 'mock data with regex url', '哈哈' ];
        var mockResHeaders = { server: 'mock server' };
        mm[modName].request({host: /cnodejs/}, mockResData, mockResHeaders, 500);

        var start = Date.now();
        mod.get({
          host: 'cnodejs.org',
          path: '/bar/foo'
        }, function (res) {
          res.headers.should.eql(mockResHeaders);
          res.setEncoding('utf8');
          var body = '';
          res.on('data', function (chunk) {
            chunk.should.be.a.String;
            body += chunk;
          });
          res.on('end', function () {
            var use = Date.now() - start;
            body.should.equal(mockResData.join(''));
            use.should.above(490);
            done();
          });
        });
      });

      it('should mock ' + modName + '.request() 500ms response delay and req.abort()', function (done) {
        var mockURL = /foo$/;
        var mockResData = 'mock data with regex url';
        var mockResHeaders = { server: 'mock server' };
        mm[modName].request(mockURL, mockResData, mockResHeaders, 500);
        done = pedding(2, done);

        var start = Date.now();
        var req = mod.get({
          host: 'cnodejs.org',
          path: '/bar/foo'
        }, function (res) {
          res.headers.should.eql(mockResHeaders);
          var body = '';
          res.on('data', function (chunk) {
            body += chunk.toString();
          });
          res.on('end', function () {
            var use = Date.now() - start;
            body.should.equal(mockResData);
            use.should.above(490);
            req.abort();
            done();
          });
        });
        req.on('error', function (err) {
          should.exist(err);
          err.message.should.equal('socket hang up');
          done();
        });
      });

      it('should mock ' + modName + '.request() 1000ms delay', function (done) {
        var mockURL = /foo$/;
        var mockResData = 'mock data with regex url';
        var mockResHeaders = { server: 'mock server' };
        mm[modName].request(mockURL, mockResData, mockResHeaders, 1000);

        var start = Date.now();
        var req = mod.get({
          host: 'cnodejs.org',
          path: '/bar/foo'
        });
        req.on('response', function (res) {
          done(new Error('should not call this'));
        });
        req.on('error', function (err) {
          should.exist(err);
          err.message.should.equal('socket hang up');
          done();
        });
        setTimeout(function () {
          req.abort();
        }, 100);
      });
    });
  });

  describe('http(s).requestError()', function () {
    ['http', 'https'].forEach(function (modName) {
      var mod = modName === 'http' ? http : https;
      it('should ' + modName + '.reqeust() return req error', function (done) {
        var modPort = modName === 'http' ? port : sslPort;

        done = pedding(2, done);

        var mockURL = '/req';
        var reqError = 'mock req error';
        mm[modName].requestError(mockURL, reqError);

        var req = mod.get({
          path: '/req',
          rejectUnauthorized: false,
          port: modPort,
        }, function (res) {
          done(new Error('should not call this'));
        });
        req.on('error', function (err) {
          should.exist(err);
          err.name.should.equal('MockHttpRequestError');
          err.message.should.equal('mock req error');
          done();
        });

        // not match
        var req = mod.get({
          host: '127.0.0.1',
          port: modPort,
          rejectUnauthorized: false,
          path: '/req_not_match'
        }, function (res) {
          var body = '';
          res.on('data', function (chunk) {
            body += chunk.toString();
          });
          res.on('end', function () {
            body.should.equal('GET /req_not_match');
            done();
          });
        });
      });

      it('should ' + modName + '.reqeust() return req error after response emit', function (done) {
        var mockURL = '/res';
        var resError = 'mock res error';
        mm[modName].requestError(mockURL, null, resError);
        done = pedding(2, done);

        var req = mod.get({
          path: '/res'
        }, function (res) {
          res.should.status(200);
          res.should.have.header('server', 'MockMateServer');
          done();
        });
        req.on('error', function (err) {
          should.exist(err);
          err.name.should.equal('MockHttpResponseError');
          err.message.should.equal('mock res error');
          done();
        });
      });

      it('should ' + modName + '.reqeust() return res error 500ms delay', function (done) {
        var mockURL = '/res';
        var resError = 'mock res error with 500ms delay';
        mm[modName].requestError(mockURL, null, resError, 500);
        done = pedding(2, done);

        var start = Date.now();
        var req = mod.get({
          path: '/res'
        }, function (res) {
          res.should.status(200);
          res.should.have.header('server', 'MockMateServer');
          done();
        });
        req.on('error', function (err) {
          should.exist(err);
          err.name.should.equal('MockHttpResponseError');
          err.message.should.equal('mock res error with 500ms delay');
          var use = Date.now() - start;
          use.should.above(490);
          done();
        });
      });

      it('should ' + modName + '.reqeust() not emit req error 1000ms delay after req.abort()', function (done) {
        var mockURL = '/res';
        var resError = 'mock res error with 500ms delay';
        mm[modName].requestError(mockURL, null, resError, 1000);

        var start = Date.now();
        var req = mod.get({
          path: '/res'
        }, function (res) {
          done(new Error('should not call this'));
        });
        req.on('error', function (err) {
          should.exist(err);
          err.name.should.equal('Error');
          err.message.should.equal('socket hang up');
          var use = Date.now() - start;
          use.should.above(90);
          done();
        });
        setTimeout(function () {
          req.abort();
        }, 100);
      });

    });

  });

  describe('spawn', function () {
    it('should mm.spawn mock spawn', function (done) {
      mm.spawn(1, 'stdout', 'stderr', 100);
      var ls = child_process.spawn('ls', ['-a']);
      var done = pedding(4, done);
      ls.on('stdout', function (data) {
        data.should.equal('stdout');
        done();
      });
      ls.on('stderr', function (data) {
        data.should.equal('stderr');
        done();
      });
      ls.on('close', function (code) {
        code.should.equal(1);
        done();
      });
      mm.restore();
      var ls = child_process.spawn('ls', ['-a']);
      ls.on('exit', function (code) {
        code.should.equal(0);
        done();
      });
    });
  });

  describe('mm()', function () {
    it('should mm() just like muk()', function (done) {
      mm(fs, 'readFile', function (filename, callback) {
        process.nextTick(function () {
          callback(null, new Buffer('filename: ' + filename));
        });
      });
      fs.readFile(__filename, function (err, data) {
        should.not.exist(err);
        data.should.be.an.instanceof(Buffer);
        data.toString().should.equal('filename: ' + __filename);
        mm.restore();
        fs.readFile(__filename, function (err, data) {
          should.not.exist(err);
          data.should.be.an.instanceof(Buffer);
          data.toString().should.containEql('mm()');
          done();
        });
      });
    });

    it('should mock readFileSync success', function (done) {
      mm(fs, 'readFileSync', function () {
        throw new Error('test error');
      });
      mm(fs, 'readFileSync', function () {
        throw new Error('test error');
      });
      (function () {
        fs.readFileSync(__filename);
      }).should.throw('test error');
      mm.restore();
      fs.readFileSync(__filename).toString().should.containEql('mm()');

      mm.error(fs, 'readFile');
      mm.error(fs, 'readFile');
      fs.readFile(__filename, function (err, data) {
        should.exists(err);
        mm.restore();
        fs.readFile(__filename, function (err, data) {
          should.not.exists(err);
          data.toString().should.containEql('mm()');
          done();
        });
      });
    });
  });

  describe('thunk', function () {
    var foo = {
      getMultiValues: thunkify(function (arg, callback) {
        setImmediate(function () {
          callback(null, 1, 2, 3);
        });
      }),
      getValue: thunkify(function (arg, callback) {
        setImmediate(function () {
          callback(null, 1);
        });
      }),
    };

    afterEach(mm.restore);

    describe('datas(), data()', function () {
      it('should mock generator function', function* () {
        mm.datas(foo, 'getMultiValues', [ 'b1', 'b2', 'b3' ]);
        var datas = yield foo.getMultiValues();
        datas.should.eql([ 'b1', 'b2', 'b3' ]);

        mm.datas(foo, 'getMultiValues', 1);
        var datas = yield foo.getMultiValues('key');
        datas.should.equal(1);

        mm.data(foo, 'getValue', 2);
        var data = yield foo.getValue('key');
        data.should.equal(2);

        mm.restore();
        var data = yield foo.getValue('key');
        data.should.equal(1);
      });
    });

    describe('error()', function () {
      it('should mock error', function* () {
        mm.error(foo, 'getValue');
        try {
          yield foo.getValue();
          throw new Error('should not run this');
        } catch (err) {
          err.message.should.equal('mm mock error');
        }

        mm.error(foo, 'getValue', 'foo error', 200);
        try {
          yield foo.getValue();
          throw new Error('should not run this');
        } catch (err) {
          err.message.should.equal('foo error');
        }

        mm.error(foo, 'getValue', new Error('new foo error'));
        try {
          yield foo.getValue();
          throw new Error('should not run this');
        } catch (err) {
          err.message.should.equal('new foo error');
        }
      });
    });
  });

});

var enable = require('enable');
if (enable.generator) {
  require('./es6');
}
