import { strict as assert } from 'node:assert';
import mm from '../src/index.js';

describe('test/es6.test.ts', () => {
  const foo = {
    async getMultiValues() {
      return [ 1, 2, 3 ];
    },
    async getValue() {
      return 1;
    },
  };

  afterEach(mm.restore);

  describe('datas(), data()', () => {
    it('should mock async function', async () => {
      let datas;
      mm.datas(foo, 'getMultiValues', [ 'b1', 'b2', 'b3' ]);
      datas = await foo.getMultiValues();
      assert.deepEqual(datas, [ 'b1', 'b2', 'b3' ]);

      mm.datas(foo, 'getMultiValues', 1);
      datas = await foo.getMultiValues();
      assert.equal(datas, 1);

      let data;
      mm.data(foo, 'getValue', 2, 500);
      data = await foo.getValue();
      assert.equal(data, 2);

      mm.restore();
      data = await foo.getValue();
      assert.equal(data, 1);
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
    it('should mock error', async () => {
      mm.error(foo, 'getValue');
      try {
        await foo.getValue();
        throw new Error('should not run this');
      } catch (err) {
        assert(err instanceof Error);
        assert.equal(err.message, 'mm mock error');
      }

      mm.error(foo, 'getValue', 'foo error', { foo: '200' });
      try {
        await foo.getValue();
        throw new Error('should not run this');
      } catch (err) {
        assert(err instanceof Error);
        assert.equal(err.message, 'foo error');
      }

      mm.error(foo, 'getValue', new Error('new foo error'));
      try {
        await foo.getValue();
        throw new Error('should not run this');
      } catch (err: any) {
        assert.equal(err.message, 'new foo error');
      }

      mm.error(foo, 'getValue', new Error('new foo error'), { status: 500 });
      try {
        await foo.getValue();
        throw new Error('should not run this');
      } catch (err: any) {
        assert.equal(err.message, 'new foo error');
        assert.equal(err.status, 500);
      }

      mm.error(foo, 'getValue', new Error('new foo error'), { status: 500 }, 100);
      const start = Date.now();
      try {
        await foo.getValue();
        throw new Error('should not run this');
      } catch (err: any) {
        const use = Date.now() - start;
        assert.equal(err.message, 'new foo error');
        assert.equal(err.status, 500);
        assert(use > 90);
      }
    });

    it('should mock error once', async () => {
      mm.errorOnce(foo, 'getValue');
      try {
        await foo.getValue();
        throw new Error('should not run this');
      } catch (err: any) {
        assert.equal(err.message, 'mm mock error');
      }

      const v = await foo.getValue();
      assert.equal(v, 1);

      mm.errorOnce(foo, 'getValue');
      try {
        await foo.getValue();
        throw new Error('should not run this');
      } catch (err: any) {
        assert.equal(err.message, 'mm mock error');
      }

      const v1 = await foo.getValue();
      assert.equal(v1, 1);
    });
  });
});
