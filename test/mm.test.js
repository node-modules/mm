/*!
 * mm - test/mm.test.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var mm = require('../');
var fs = require('fs');
var should = require('should');
var http = require('http');
var pedding = require('pedding');


describe('mm.test.js', function () {

  var port = null;

  before(function (done) {
    var app = http.createServer(function (req, res) {
      res.end(req.method + ' ' + req.url);
    });
    app.listen(0, function () {
      port = app.address().port;
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

  describe('http.request()', function () {
    it('should mock http.request() response', function (done) {
      done = pedding(2, done);

      var mockURL = '/foo';
      var mockResData = 'mock data';
      var mockResHeaders = { server: 'mock server' };
      mm.http.request(mockURL, mockResData, mockResHeaders);

      http.get({
        host: '127.0.0.1',
        port: port,
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
      http.get({
        host: '127.0.0.1',
        port: port,
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

    it('should mock http.request() response with regex url', function (done) {
      var mockURL = /foo$/;
      var mockResData = 'mock data with regex url';
      var mockResHeaders = { server: 'mock server' };
      mm.http.request(mockURL, mockResData, mockResHeaders);

      http.get({
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
    });

    it('should mock http.request() 500ms response delay', function (done) {
      var mockURL = /foo$/;
      var mockResData = 'mock data with regex url';
      var mockResHeaders = { server: 'mock server' };
      mm.http.request(mockURL, mockResData, mockResHeaders, 500);

      var start = Date.now();
      http.get({
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
          done();
        });
      });
    });

  });

  describe('http.requestError', function () {
    it('should http.reqeust() return req error', function (done) {
      done = pedding(2, done);

      var mockURL = '/req';
      var reqError = 'mock req error';
      mm.http.requestError(mockURL, reqError);

      var req = http.get({
        path: '/req'
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
      var req = http.get({
        host: '127.0.0.1',
        port: port,
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

    it('should http.reqeust() return req error after response emit', function (done) {
      var mockURL = '/res';
      var resError = 'mock res error';
      mm.http.requestError(mockURL, null, resError);
      done = pedding(2, done);

      var req = http.get({
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

    it('should http.reqeust() return res error 500ms delay', function (done) {
      var mockURL = '/res';
      var resError = 'mock res error with 500ms delay';
      mm.http.requestError(mockURL, null, resError, 500);
      done = pedding(2, done);

      var start = Date.now();
      var req = http.get({
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
  });

});