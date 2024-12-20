import { strict as assert } from 'node:assert';
import { mm, restore, mockDatas } from '../src/index.js';

describe('test/async-await.test.ts', () => {
  const foo = {
    async request() {
      return 'yes';
    },
    * generatorRequest() {
      return 'yes';
    },
  };

  afterEach(restore);

  describe('mm()', () => {
    it('should mock async function', async () => {
      let datas;
      mm(foo, 'request', async () => {
        return 'no';
      });
      datas = await foo.request();
      assert.equal(datas, 'no');

      restore();
      datas = await foo.request();
      assert(datas, 'yes');
    });

    it('should mock async function to normal throw type error', async () => {
      try {
        mm(foo, 'request', () => {
          return 'no';
        });
        foo.request();
        throw new Error('should not run this');
      } catch (err) {
        assert(err instanceof Error);
        assert.equal(err.message, 'Can\'t mock async function to normal function for property "request"');
      }
    });

    it('should mock generator function to normal throw type error', async () => {
      try {
        mm(foo, 'generatorRequest', () => {
          return 'no';
        });
        foo.generatorRequest();
        throw new Error('should not run this');
      } catch (err) {
        assert(err instanceof Error);
        assert.equal(err.message, 'Can\'t mock async function to normal function for property "generatorRequest"');
      }
    });

    it('should mock async function to normal function return promise should work', async () => {
      try {
        mm(foo, 'request', () => {
          return Promise.resolve('no');
        });
        foo.request();
        throw new Error('should not run this');
      } catch (err) {
        assert(err instanceof Error);
        assert.equal(err.message, 'should not run this');
      }
    });
  });

  describe('datas(), data()', () => {
    it('should mock async function', async () => {
      let datas;
      mockDatas(foo, 'request', 'no');
      datas = await foo.request();
      assert.equal(datas, 'no');

      restore();
      datas = await foo.request();
      assert.equal(datas, 'yes');
    });
  });
});
