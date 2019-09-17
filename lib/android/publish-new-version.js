#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const execSync = require("child_process").execSync;
const yaml = require("js-yaml");
const util = require("../util");

util.makeSureInRoot();

const BUILD_TYPE = process.env.BUILD_TYPE;

if (BUILD_TYPE == "release" && !process.env.PROJECT_VERSION) {
  throw new Error("Please specify PROJECT_VERSION for release!");
}

const APK_SRC = "app/build/outputs/apk";
const VERSION_FROM_GRADLE = util.getVersionNameFromGradle();
const BUILD_NUMBER = util.getVersionCodeFromGradle();
const PROJECT_VERSION = process.env.PROJECT_VERSION || VERSION_FROM_GRADLE;

if (!BUILD_TYPE) {
  throw new Error("Please specify BUILD_TYPE!");
}
if (VERSION_FROM_GRADLE != PROJECT_VERSION) {
  throw new Error(
    `PROJECT_VERSION ${PROJECT_VERSION} does not match version from gradle build file ${VERSION_FROM_GRADLE}!`
  );
}

util.logLine();
console.log("BUILD_TYPE: " + BUILD_TYPE);
console.log("PROJECT_VERSION: " + PROJECT_VERSION);
console.log("BUILD_NUMBER: " + BUILD_NUMBER);

const filePath = path.resolve("version", PROJECT_VERSION + ".yml");
util.logLine();
console.log("Parsing file: " + filePath);
const version = yaml.safeLoad(fs.readFileSync(filePath));

validate(version);

version.versionCode = PROJECT_VERSION;
version.readyTime = version.readyTime.getTime();
version.forceUpdate = version.forceUpdate ? 1 : 0;
version.remark = version.remark || "";
version.buildType = BUILD_TYPE;

const versionJsonStr = JSON.stringify(version, null, 2);

util.logLine();
console.log(versionJsonStr);

if (process.env.DRY_RUN) {
  process.exit();
}

fs.readdir(APK_SRC, function(err, files) {
  if (err) {
    throw err;
  }
  files.forEach(function(file, i) {
    fs.writeFileSync(
      `dist/apk/publish-${file}-${BUILD_TYPE}-${PROJECT_VERSION}.json`,
      versionJsonStr
    );
  });

  const gulpCommand = `NODE_ENV=production npx gulp publish-new-version`;
  const gulpOutput = execSync(gulpCommand);
  util.logLine();
  console.log(gulpCommand);
  console.log(gulpOutput.toString());

  util.logLine();
  console.log(`Published new version ${PROJECT_VERSION} successfully!`);
});

function validate(version) {
  if (!version.releaseNote) {
    util.exitWithError("Please specify releaseNote!");
  }
  if (!(version.readyTime instanceof Date)) {
    util.exitWithError("readyTime must be instanceof Date!");
  }
  if (version.releaseNote.length > 300) {
    util.exitWithError("Max length of releaseNote is 300!");
  }
  if (version.remark && version.remark.length > 255) {
    util.exitWithError("Max length of remark is 255!");
  }
}
