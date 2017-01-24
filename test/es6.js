'use strict';

const mm = require('../');

describe('test/es6.test.js', function() {
  const foo = {
    * getMultiValues() {
      return [ 1, 2, 3 ];
    },
    * getValue() {
      return 1;
    },
  };

  afterEach(mm.restore);

  describe('datas(), data()', function() {
    it('should mock generator function', function* () {
      let datas;
      mm.datas(foo, 'getMultiValues', [ 'b1', 'b2', 'b3' ]);
      datas = yield* foo.getMultiValues();
      datas.should.eql([ 'b1', 'b2', 'b3' ]);

      mm.datas(foo, 'getMultiValues', 1);
      datas = yield* foo.getMultiValues();
      datas.should.equal(1);

      let data;
      mm.data(foo, 'getValue', 2, 500);
      data = yield* foo.getValue();
      data.should.equal(2);

      mm.restore();
      data = yield* foo.getValue();
      data.should.equal(1);
    });
  });

  describe('error()', function() {
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

      mm.error(foo, 'getValue', new Error('new foo error'), { status: 500 });
      try {
        yield* foo.getValue();
        throw new Error('should not run this');
      } catch (err) {
        err.message.should.equal('new foo error');
        err.status.should.equal(500);
      }

      mm.error(foo, 'getValue', new Error('new foo error'), { status: 500 }, 100);
      let start;
      try {
        start = Date.now();
        yield* foo.getValue();
        throw new Error('should not run this');
      } catch (err) {
        const use = Date.now() - start;
        err.message.should.equal('new foo error');
        err.status.should.equal(500);
        use.should.above(90);
      }
    });
  });
});
