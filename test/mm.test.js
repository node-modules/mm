/*!
 * mm - test/mm.test.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var path = require('path');
var mm = require('../');
var fs = require('fs');
var should = require('should');
var http = require('http');
var https = require('https');
var pedding = require('pedding');


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
          data.should.include('127.0.0.1');
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
            chunk.should.be.a('string');
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
          data.toString().should.include('mm()');
          done();
        });
      });
    });
  });

});