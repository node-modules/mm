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

describe('mm.test.js', function () {
  
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

});