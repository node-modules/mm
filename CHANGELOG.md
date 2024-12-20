# Changelog

## [4.0.0](https://github.com/node-modules/mm/compare/v3.4.0...v4.0.0) (2024-12-20)


### ⚠ BREAKING CHANGES

* drop Node.js < 18.19.0 support

part of https://github.com/eggjs/egg/issues/3644

https://github.com/eggjs/egg/issues/5257

### Features

* support cjs and esm both by tshy ([#61](https://github.com/node-modules/mm/issues/61)) ([f1eadcc](https://github.com/node-modules/mm/commit/f1eadcc4a7fbd5263f7e2e98d7747e1df9f5ae40))

## [3.4.0](https://github.com/node-modules/mm/compare/v3.3.0...v3.4.0) (2023-12-09)


### Features

* support mock.dataWithAsyncDispose() ([#59](https://github.com/node-modules/mm/issues/59)) ([7581288](https://github.com/node-modules/mm/commit/7581288b807a3f1f61bd1027ac0b451f7ddfad0c))

## [3.3.0](https://github.com/node-modules/mm/compare/v3.2.4...v3.3.0) (2023-05-16)


### Features

* upgrade deps ([#58](https://github.com/node-modules/mm/issues/58)) ([d16b55c](https://github.com/node-modules/mm/commit/d16b55cfc97f212109712307f7a4f3e986370aab))

## [3.2.4](https://github.com/node-modules/mm/compare/v3.2.3...v3.2.4) (2023-05-16)


### Bug Fixes

* revert upgrade muk-prop@3.x ([#57](https://github.com/node-modules/mm/issues/57)) ([60d5668](https://github.com/node-modules/mm/commit/60d5668f7a8354eb05156ad54bbfdd78a6085eef))

## [3.2.3](https://github.com/node-modules/mm/compare/v3.2.2...v3.2.3) (2023-05-12)


### Bug Fixes

* **deps:** upgrade muk-prop@3.0.0 ([#56](https://github.com/node-modules/mm/issues/56)) ([c1b7a55](https://github.com/node-modules/mm/commit/c1b7a55f17b27c5ca00e272b000d12038785584a))

## [3.2.2](https://github.com/node-modules/mm/compare/v3.2.1...v3.2.2) (2023-04-02)


### Bug Fixes

* spy statistics is not reset after restore ([#55](https://github.com/node-modules/mm/issues/55)) ([97dcf42](https://github.com/node-modules/mm/commit/97dcf42d07b5933ce1ef87d1e6fd8c94bd41dcf6))

---


3.2.1 / 2022-11-20
==================

**fixes**
  * [[`8c4c458`](http://github.com/node-modules/mm/commit/8c4c458de9c95867b61daf3352ae23867a22a334)] - fix: support mock function which has properties (#53) (killa <<killa123@126.com>>)

3.2.0 / 2020-03-24
==================

**features**
  * [[`d2e4c28`](http://github.com/node-modules/mm/commit/d2e4c28014c13449fa469bbe656ccea683eeca84)] - feat: support mock class method from instance (#52) (fengmk2 <<fengmk2@gmail.com>>)

3.1.0 / 2020-03-13
==================

**features**
  * [[`5ed8a73`](http://github.com/node-modules/mm/commit/5ed8a7305ddd8e3bf0892897f7fd160f3bf0b09b)] - feat: mm.spy method (#51) (Yiyu He <<dead_horse@qq.com>>)

3.0.3 / 2020-03-12
==================

**fixes**
  * [[`8fea4ad`](http://github.com/node-modules/mm/commit/8fea4ada1c5a49fbe8ade4fb0102024a850f2f57)] - fix: support mock jest.fn() (Yiyu He <<dead_horse@qq.com>>)

3.0.2 / 2020-03-01
==================

**fixes**
  * [[`0e310b4`](http://github.com/node-modules/mm/commit/0e310b4d6f3d5511f4e86971413014fe5f496ce7)] - fix: do function type check after execute (#49) (Yiyu He <<dead_horse@qq.com>>)

3.0.1 / 2020-03-01
==================

**fixes**
  * [[`6ca26e4`](http://github.com/node-modules/mm/commit/6ca26e4a600e365885f5056be3cd084408e5d7ea)] - fix: fix this binding (#48) (Yiyu He <<dead_horse@qq.com>>)

3.0.0 / 2020-03-01
==================

**features**
  * [[`f49c32e`](http://github.com/node-modules/mm/commit/f49c32e84fdef24655fdc25289d7aeb2e9560c0c)] - feat: spy function by default (#47) (Yiyu He <<dead_horse@qq.com>>)
  * [[`d8d9aa3`](http://github.com/node-modules/mm/commit/d8d9aa3562249e767eb7f0cb13bb325a9dbac91b)] - feat: [BREAKING] don't allow to mock async function to normal function (#46) (fengmk2 <<fengmk2@gmail.com>>)

**others**
  * [[`eec0876`](http://github.com/node-modules/mm/commit/eec08767b681bc7e3d6d69cdfa7049b22d716239)] - chore: fix errorOnce (fengmk2 <<fengmk2@gmail.com>>)

2.5.0 / 2019-03-06
==================

**features**
  * [[`c204c5e`](http://github.com/node-modules/mm/commit/c204c5e91eb4f2cb7263cd010293f966dc555808)] - feat: support mock error once (#45) (fengmk2 <<fengmk2@gmail.com>>)

**others**
  * [[`2cb2baf`](http://github.com/node-modules/mm/commit/2cb2bafac4344c926cbd3eb60ab2bbde3ebd4ca7)] - test: run test on macos on azure-pipelines (#44) (fengmk2 <<fengmk2@gmail.com>>)

2.4.1 / 2018-08-27
==================

  **fixes**
  * [[`58eb437`](https://github.com/node-modules/mm/commit/58eb4370e6f6cd5d671799c13ba1e93e759afe2f)] - fix: typpings error (#43) (whxaxes <<whxaxes@gmail.com>>)

2.4.0 / 2018-08-08
==================

**others**
  * [[`6a84a0a`](http://github.com/node-modules/mm/commit/6a84a0a9c01a8e68e08eb63b4d587b73cb8fd74a)] - refactor(tsd): use Interface Function Type so that egg-mock can extends this; (#42) (paranoidjk <<hust2012jiangkai@gmail.com>>)

2.3.0 / 2018-08-07
==================

**features**
  * [[`ea75ed5`](http://github.com/node-modules/mm/commit/ea75ed594e776e6acbbbd8a769256973ba4a9ce5)] - feat: add .d.ts (#41) (paranoidjk <<hust2012jiangkai@gmail.com>>)

2.2.2 / 2018-07-12
==================

**fixes**
  * [[`2cd32f9`](http://github.com/node-modules/mm/commit/2cd32f951e3881fd6cdd1768d54b015ced82860c)] - fix: mock http error response need socket (#40) (Yiyu He <<dead_horse@qq.com>>)

2.2.1 / 2018-07-11
==================

**fixes**
  * [[`721dc6b`](http://github.com/node-modules/mm/commit/721dc6b533d6ef148f09e708d1ab2230115cce14)] - fix: support node 10 on https (#39) (fengmk2 <<fengmk2@gmail.com>>)

2.2.0 / 2017-09-07
==================

**features**
  * [[`72e5478`](http://github.com/node-modules/mm/commit/72e54784c5c0c094da6c345ce65f50bbc31b5889)] - feat: use stream class to replace EventEmitter. (Qi Yu <<njuyuqi@gmail.com>>)

**others**
  * [[`eb0eaae`](http://github.com/node-modules/mm/commit/eb0eaae30989298988c1ea8f0024158dcc367ba2)] - test: add mock request pipe test case (fengmk2 <<fengmk2@gmail.com>>)

2.1.1 / 2017-09-06
==================

**fixes**
  * [[`ea1194c`](http://github.com/node-modules/mm/commit/ea1194c2c5fc34ee74c6a33776495ec2f8545f16)] - fix: should support http request mock on node8 (#38) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`007f053`](http://github.com/node-modules/mm/commit/007f053117bb11c3789d545c4ccd50e2a8237fd5)] - fix: README typo (#32) (HC Chen <<chceyes@gmail.com>>)

**others**
  * [[`0e818e3`](http://github.com/node-modules/mm/commit/0e818e3f6d977a07b43db03fa9735de5e8115612)] - test: fix test on node4 (#33) (Haoliang Gao <<sakura9515@gmail.com>>)

2.1.0 / 2017-01-25
==================

  * deps: use muk-prop instead of muk (#30)

2.0.1 / 2017-01-22
==================

  * fix: Only restore the http/https request when used.

2.0.0 / 2016-07-31
==================

  * feat: upgrade dependencies (#29)

1.5.1 / 2016-07-21
==================

  * fix: keep status code (#28)

1.5.0 / 2016-06-13
==================

  * feat: export isMocked (#27)

1.4.0 / 2016-06-12
==================

  * deps: upgrade muk (#26)
  * feat: remove EventEmitter from 'event' module

1.3.5 / 2015-09-29
==================

 * fix: should support mock multi env

1.3.4 / 2015-09-24
==================

 * test: use codecov.io
 * feat: support mock process.env.KEY

1.3.3 / 2015-09-17
==================

 * deps: upgrade muk to 0.4.0 to support mock getter

1.3.2 / 2015-09-17
==================

 * fix: deps muk 0.3.2

1.3.1 / 2015-08-31
==================

  * hotfix: fix mm.error in es6

1.3.0 / 2015-08-22
==================

 * readme: add sync methods and error properties
 * feat: mock error support props
 * chore: use npm scripts

1.2.0 / 2015-08-16
==================

 * feat(sync): add sync mock methods

1.1.0 / 2015-05-08
==================

 * feat: support promise

1.0.1 / 2014-10-30
==================

 * still thunkify the methods

1.0.0 / 2014-10-30
==================

 * docs(readme): add badges
 * feat(error): support mock error on generator function
 * feat(data): support mock generator function

0.2.1 / 2014-03-14
==================

  * if coveralls crash, dont break the test pass
  * fix http request mock not work on 0.11.12 and no more test on 0.8.x

0.2.0 / 2014-02-21
==================

  * support thunkify cnpm/cnpmjs.org#196

0.1.8 / 2013-12-27
==================

  * fix Node 0.11 broken. (@alsotang)
  * fix test cases

0.1.7 / 2013-11-20
==================

  * http.request mock support mm.http.request({host: $host, url: $url})
  * add npm image

0.1.6 / 2013-07-04
==================

  * update muk to 0.3.1, it had fixed https://github.com/fent/node-muk/pull/2 bug

0.1.5 / 2013-07-03
==================

  * hot fixed #5 mock same method twices restore fails bug
  * add test for fs.readFileSync. fixed #5
  * support coveralls

0.1.4 / 2013-05-21
==================

  * use blanket instead of jscover
  * fixed spawn test fail on node 0.6
  * support emtpy error

0.1.3 / 2013-05-05
==================

  * Merge pull request #3 from dead-horse/support-spawn
  * do not emit when null
  * add support for spawn

0.1.2 / 2013-04-20
==================

  * fix mm.datas
  * update travis

0.1.1 / 2013-04-15
==================

  * update muk to 0.3.0+

0.1.0 / 2012-12-01
==================

  * fixed restore not effect on http(s)

0.0.9 / 2012-11-28
==================

  * add request() mock statusCode

0.0.8 / 2012-11-27
==================

  * add mm.datas(), mm.data(), mm.empty() mock methods

0.0.7 / 2012-11-26
==================

  * try to find callback in arguments
  * fixed CERT_HAS_EXPIRED with `rejectUnauthorized = false`

0.0.6 / 2012-11-21
==================

  * fix http.request() twice bug; add res.setEncoding method

0.0.5 / 2012-11-21
==================

  * fixed #1 support mm.https.request mock helpers

0.0.4 / 2012-11-13
==================

  * add mm() just like muk() does

0.0.3 / 2012-11-06
==================

  * add req.abort() for mock request object

0.0.2 / 2012-11-06
==================

  * when mock response error, must emit `req` error not `res` error event.
  * replace logo

0.0.1 / 2012-11-04
==================

  * add mock http.request() and http.requestError()
  * add mm.error() impl
  * Release 0.0.1
