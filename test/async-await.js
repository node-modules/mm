const mm = require('..');

describe('test/async-await.test.js', () => {
  const foo = {
    async request() {
      return 'yes';
    },
    * generatorRequest() {
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
        foo.request();
        throw new Error('should not run this');
      } catch (err) {
        err.message.should.equal('Can\'t mock async function to normal function for property "request"');
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
        err.message.should.equal('Can\'t mock async function to normal function for property "generatorRequest"');
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
        err.message.should.equal('should not run this');
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
