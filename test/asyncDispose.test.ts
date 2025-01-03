import { strict as assert } from 'node:assert';
import * as mm from '../src/index.js';

describe('test/asyncDispose.test.ts', () => {
  const foo = {
    async request() {
      return 'yes';
    },
    async echo() {
      return {
        hi: 'yes',
        async [Symbol.asyncDispose]() {
          console.log('asyncDispose run');
        },
      };
    },
    * generatorRequest() {
      return 'yes';
    },
  };

  afterEach(mm.restore);

  describe('dataWithAsyncDispose()', () => {
    it('should mock async function with asyncDispose', async () => {
      await using data0 = await foo.echo();
      assert.equal(data0.hi, 'yes');

      mm.dataWithAsyncDispose(foo, 'echo', {
        hi: 'no',
      });
      await using data1 = await foo.echo();
      assert.equal(data1.hi, 'no');

      mm.restore();
      await using data2 = await foo.echo();
      assert.equal(data2.hi, 'yes');
    });
  });
});
