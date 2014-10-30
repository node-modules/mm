/**!
 * mm - test/thunk.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com>
 */

'use strict';

/**
 * Module dependencies.
 */

var thunkify = require('thunkify-wrap');
var mm = require('..');

describe('thunk.js', function () {
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
