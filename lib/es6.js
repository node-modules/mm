const is = require('is-type-of');
const mm = require('./mm');

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

const mockDatas = mm.datas;
// support generator
mm.datas = function(mod, method, datas, timeout) {
  const isGeneratorFunction = is.generatorFunction(mod[method]);
  const isAsyncFunction = is.asyncFunction(mod[method]);
  if (!isGeneratorFunction && !isAsyncFunction) {
    return mockDatas.call(mm, mod, method, datas, timeout);
  }

  if (timeout) {
    timeout = parseInt(timeout, 10);
  }
  timeout = timeout || 0;
  if (isGeneratorFunction) {
    mm(mod, method, function* () {
      yield sleep(timeout);
      return datas;
    });
  } else {
    mm(mod, method, async function() {
      await sleep(timeout);
      return datas;
    });
  }
  return this;
};

const mockData = mm.data;
mm.data = function(mod, method, data, timeout) {
  if (!is.generatorFunction(mod[method]) && !is.asyncFunction(mod[method])) {
    return mockData.call(mm, mod, method, data, timeout);
  }

  return mm.datas(mod, method, data, timeout);
};

const mockError = mm.error;
mm.error = function(mod, method, error, props, timeout) {
  if (!is.generatorFunction(mod[method])) {
    return mockError.call(mm, mod, method, error, props, timeout);
  }

  error = mm._createError(error, props);

  if (timeout) {
    timeout = parseInt(timeout, 10);
  }
  timeout = timeout || 0;
  mm(mod, method, function* () {
    yield sleep(timeout);
    throw error;
  });
  return this;
};

const mockErrorOnce = mm.errorOnce;
mm.errorOnce = function(mod, method, error, props, timeout) {
  if (!is.generatorFunction(mod[method])) {
    return mockErrorOnce.call(mm, mod, method, error, props, timeout);
  }

  error = mm._createError(error, props);

  if (timeout) {
    timeout = parseInt(timeout, 10);
  }
  timeout = timeout || 0;
  mm(mod, method, function* () {
    yield sleep(timeout);
    mm.restore();
    throw error;
  });
  return this;
};

// mock class method from instance
mm.classMethod = function(instance, property, value) {
  return mm(instance.constructor.prototype, property, value);
};
