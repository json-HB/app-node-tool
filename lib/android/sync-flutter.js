#!/usr/bin/env node

const path = require('path');
const gulp = require('gulp');
const del = require('del');
const yargs = require('yargs');
const util = require('../util');

util.makeSureInRoot();

const ARGV = yargs.argv;
const START_TIME = new Date().getTime();
const CLEAN = process.env.CLEAN == '1' || !!ARGV.clean;
const BUILD_TYPE = process.env.BUILD_TYPE == 'release' ? 'release' : 'debug';
const FLUTTER_DIR = path.resolve('..', util.getFlutterProjectName());

console.log('BUILD_TYPE: ' + BUILD_TYPE);

if (CLEAN) {
  if (util.isYarnAvailable()) {
    util.execAndLog('yarn run clean', {cwd: FLUTTER_DIR});
  } else {
    util.execAndLog('npm run clean', {cwd: FLUTTER_DIR});
  }
  util.execAndLog('flutter packages get', {cwd: FLUTTER_DIR});
}
if (util.isYarnAvailable()) {
  util.execAndLog('yarn run locale', {cwd: FLUTTER_DIR});
} else {
  util.execAndLog('npm run locale', {cwd: FLUTTER_DIR});
}
util.execAndLog('flutter build apk --' + BUILD_TYPE, {cwd: FLUTTER_DIR});

del.sync([
  'app/src/main/assets/flutter_assets/**',
  'app/src/main/assets/isolate_snapshot_data',
  'app/src/main/assets/isolate_snapshot_instr',
  'app/src/main/assets/vm_snapshot_data',
  'app/src/main/assets/vm_snapshot_instr'
]);

const SRC_BASE = FLUTTER_DIR + '/.android/Flutter/build/intermediates/flutter/' + BUILD_TYPE;
gulp.src([SRC_BASE + '/flutter_assets/**/*'].concat(BUILD_TYPE == 'release' ? [
  SRC_BASE + '/isolate_snapshot_data',
  SRC_BASE + '/isolate_snapshot_instr',
  SRC_BASE + '/vm_snapshot_data',
  SRC_BASE + '/vm_snapshot_instr'
] : []), {base: SRC_BASE}).pipe(gulp.dest('app/src/main/assets')).on('finish', (e) => {
  if (e) {
    console.log(e);
    process.exit(1);
  } else {
    console.log(`Sync flutter successfully in ${((new Date().getTime() - START_TIME) / 1000).toFixed(1)}s!`);
    process.exit(0);
  }
});
