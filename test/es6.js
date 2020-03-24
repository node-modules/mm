'use strict';

const assert = require('assert');
const mm = require('..');

describe('test/es6.test.js', () => {
  const foo = {
    * getMultiValues() {
      return [ 1, 2, 3 ];
    },
    * getValue() {
      return 1;
    },
  };

  afterEach(mm.restore);

  describe('datas(), data()', () => {
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

  describe('classMethod()', () => {
    it('should class method from instance', async () => {
      class Foo {
        async fetch() {
          return 1;
        }
      }

      const foo = new Foo();
      const foo1 = new Foo();
      assert(await foo.fetch() === 1);
      assert(await foo1.fetch() === 1);

      mm(foo, 'fetch', async () => {
        return 2;
      });
      assert(await foo.fetch() === 2);
      assert(await foo1.fetch() === 1);

      mm.restore();
      mm.classMethod(foo, 'fetch', async () => {
        return 3;
      });
      assert(await foo.fetch() === 3);
      assert(await foo1.fetch() === 3);

      mm.restore();
      mm.classMethod(foo, 'fetch', async () => {
        return 4;
      });
      const foo2 = new Foo();
      assert(await foo.fetch() === 4);
      assert(await foo1.fetch() === 4);
      assert(await foo2.fetch() === 4);
      const foo3 = new Foo();
      assert(await foo3.fetch() === 4);
    });
  });

  describe('error(), errorOnce()', () => {
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

    it('should mock error once', function* () {
      mm.errorOnce(foo, 'getValue');
      try {
        yield foo.getValue();
        throw new Error('should not run this');
      } catch (err) {
        err.message.should.equal('mm mock error');
      }

      const v = yield foo.getValue();
      v.should.equal(1);

      mm.errorOnce(foo, 'getValue');
      try {
        yield* foo.getValue();
        throw new Error('should not run this');
      } catch (err) {
        err.message.should.equal('mm mock error');
      }

      const v1 = yield* foo.getValue();
      v1.should.equal(1);
    });
  });
});
