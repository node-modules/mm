'use strict';

const urllib = require('urllib');
const co = require('co');
const fs = require('fs');
const mm = require('../');

co(function* () {
  mm.http.request(/\//, fs.createReadStream(__filename), { statusCode: 404 });
  const r = yield urllib.request('http://nodejs.org');
  console.log(r.status, r.headers, r.data.length);
  r.data.toString().should.equal(fs.readFileSync(__filename, 'utf8'));
})();
