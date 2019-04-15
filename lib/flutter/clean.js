#!/usr/bin/env node

const del = require('del');
const util = require('../util');

util.makeSureInRoot();

try {
  util.execAndLog('flutter clean');
} catch(e) {}

console.log("Cleaning...");
del.sync([
  '.android/**',
  '.ios/**',
  'lib/locale/locale.dart',
  'lib/locale/build/**',
  'lib/model/**/*.g.dart'
]);

console.log("Clean finished!");
