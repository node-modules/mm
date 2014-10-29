/**!
 * mm - test/es6.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var mm = require('../');

describe('es6.js', function () {
  var foo = {
    getMultiValues: function* () {
      return [1, 2, 3];
    },
    getValue: function* () {
      return 1;
    }
  };

  describe('datas(), data()', function () {
    it('should mock generator function', function* () {
      mm.datas(foo, 'getMultiValues', [ 'b1', 'b2', 'b3' ]);
      var datas = yield* foo.getMultiValues();
      datas.should.eql([ 'b1', 'b2', 'b3' ]);

      mm.datas(foo, 'getMultiValues', 1);
      var datas = yield* foo.getMultiValues();
      datas.should.equal(1);

      mm.data(foo, 'getValue', 2, 500);
      var data = yield* foo.getValue();
      data.should.equal(2);
    });
  });

  describe('error()', function () {
    it('should mock error', function* () {
      mm.error(foo, 'getValue');
      try {
        yield* foo.getValue();
        throw new Error('should not run this');
      } catch (err) {
        err.message.should.equal('mm mock error');
      }

      mm.error(foo, 'getValue', 'foo error', 200);
      try {
        yield* foo.getValue();
        throw new Error('should not run this');
      } catch (err) {
        err.message.should.equal('foo error');
      }

      mm.error(foo, 'getValue', new Error('new foo error'));
      try {
        yield* foo.getValue();
        throw new Error('should not run this');
      } catch (err) {
        err.message.should.equal('new foo error');
      }
    });
  });
});
