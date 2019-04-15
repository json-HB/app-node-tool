const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const GRADLE_FILE_PATH = path.resolve('app/build.gradle');

let gradleFileContent;
let yarnAvailable;

exports.logLine = function () {
  console.log(new Array(100).join('-'));
}

exports.execAndLog = function (...args) {
  console.log(execSync(...args).toString());
};

exports.exitWithError = function (err) {
  console.log(err);
  process.exit(1);
}

exports.getProjectName = function () {
  let name;
  try {
    name = require(path.resolve('./package.json')).name;
  } catch (e) {
    name = '';
  }
  return name;
}

exports.getFlutterProjectName = function () {
  return exports.getProjectName().replace(/-/g, '_') + '_flutter';
}

exports.makeSureInRoot = function () {
  const whiteList = [
    'lp_flutter_base',
    'app-danabersama',
    'app_danabersama_flutter',
    'app-checkin',
    'app_checkin_flutter'
  ];
  const name = exports.getProjectName();
  if (!whiteList.includes(name) || __dirname.indexOf(name) === -1) {
    exports.exitWithError('Please work in project root!');
  }
};

exports.isYarnAvailable = function () {
  if (yarnAvailable != null) {
    return yarnAvailable;
  }
  try {
    execSync('yarn --version');
    yarnAvailable = true
  } catch (err) {}
  yarnAvailable = false;
  return yarnAvailable;
};

exports.getVersionNameFromGradle = function () {
  if (!gradleFileContent) {
    gradleFileContent = fs.readFileSync(GRADLE_FILE_PATH).toString();
  }
  const m = gradleFileContent.match(/\bversionName +(['"])(\d{1,3}\.\d{1,3}\.\d{1,3})\1/g);
  if (!m) {
    throw new Error('Can not find versionName definition from ' + GRADLE_FILE_PATH);
  }
  if (m.length > 1) {
    throw new Error('Multiple versionName definition found in ' + GRADLE_FILE_PATH);
  }
  return 'v' + m[0].split(/'|"/)[1];
}

exports.getVersionCodeFromGradle = function () {
  if (!gradleFileContent) {
    gradleFileContent = fs.readFileSync(GRADLE_FILE_PATH).toString();
  }
  const m = gradleFileContent.match(/\bversionCode +\d{1,4}/g);
  if (!m) {
    throw new Error('Can not find versionCode definition from ' + GRADLE_FILE_PATH);
  }
  if (m.length > 1) {
    throw new Error('Multiple versionCode definition found in ' + GRADLE_FILE_PATH);
  }
  return m[0].split(/ +/)[1];
}
