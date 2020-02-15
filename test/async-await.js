'use strict';

const mm = require('..');

describe('test/async-await.test.js', () => {
  const foo = {
    async request() {
      return 'yes';
    },
  };

  afterEach(mm.restore);

  describe('mm()', () => {
    it('should mock async function', async () => {
      let datas;
      mm(foo, 'request', async () => {
        return 'no';
      });
      datas = await foo.request();
      datas.should.equal('no');

      mm.restore();
      datas = await foo.request();
      datas.should.equal('yes');
    });

    it('should mock async function to normal throw type error', async () => {
      try {
        mm(foo, 'request', () => {
          return 'no';
        });
        throw new Error('should not run this');
      } catch (err) {
        err.message.should.equal('Can\'t mock async function to normal function');
      }
    });
  });

  describe('datas(), data()', () => {
    it('should mock async function', async () => {
      let datas;
      mm.datas(foo, 'request', 'no');
      datas = await foo.request();
      datas.should.equal('no');

      mm.restore();
      datas = await foo.request();
      datas.should.equal('yes');
    });
  });
});
