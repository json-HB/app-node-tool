#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const execSync = require("child_process").execSync;
const util = require("../util");

util.makeSureInRoot();

const BUILD_TYPE = process.env.BUILD_TYPE;

if (BUILD_TYPE == "release" && !process.env.PROJECT_VERSION) {
  throw new Error("Please specify PROJECT_VERSION for release!");
}

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

const APK_SRC = "app/build/outputs/apk";
const APK_DIST = path.join("dist/apk", BUILD_TYPE);

util.logLine();
console.log("BUILD_TYPE: " + BUILD_TYPE);
console.log("PROJECT_VERSION: " + PROJECT_VERSION);
console.log("BUILD_NUMBER: " + BUILD_NUMBER);

fs.readdir(APK_SRC, function(err, files) {
  if (err) {
    throw err;
  }
  files.forEach(function(file, i) {
    const channelFilePath = "channel/" + file + ".txt";
    if (fs.existsSync(channelFilePath)) {
      const flavor = file;
      buildChannel(flavor, channelFilePath);
    }
  });
  util.logLine();
  console.log("Build Result:");
  console.log(fs.readdirSync(APK_DIST).join("\n"));
  util.logLine();
  // Due to auto upgrade issue, keep all the channels in the same folder
  // moveAdminChannel();
});

function moveAdminChannel() {
  const distFileList = fs.readdirSync(APK_DIST);
  distFileList.forEach(function(file) {
    if (/_admin\.apk$/.test(file)) {
      const adminDir = path.resolve(APK_DIST, "../admin");
      if (!fs.existsSync(adminDir)) {
        fs.mkdirSync(adminDir, { recursive: true });
      }
      const src = path.resolve(APK_DIST, file);
      const dest = path.resolve(APK_DIST, "../admin", file);
      console.log(`Rename: ${src} -> ${dest}`);
      fs.renameSync(src, dest);
    }
  });
}

function buildChannel(flavor, channelFilePath) {
  const apkDir = path.join(APK_SRC, flavor, BUILD_TYPE);
  if (!fs.existsSync(apkDir)) {
    throw new Error("Can not find dir: " + apkDir);
  }
  const channels = fs
    .readFileSync(channelFilePath)
    .toString()
    .split(/\r\n|\n/)
    .join(", ");
  util.logLine();
  console.log("Building channels for " + flavor);
  console.log("Channels: " + channels);
  const versionApkFile = path.join(
    apkDir,
    `${flavor}_${BUILD_TYPE}_${PROJECT_VERSION}.apk`
  );
  const latestApkFile = path.join(apkDir, `${flavor}_${BUILD_TYPE}.apk`);
  if (BUILD_TYPE == "release") {
    if (!fs.existsSync(versionApkFile)) {
      throw new Error("Can not find apk file" + versionApkFile);
    }
    fs.copyFileSync(versionApkFile, latestApkFile);
    console.log("Version APK: " + versionApkFile);
    console.log("Latest APK: " + latestApkFile);
  } else {
    const buildApkFile = path.join(
      apkDir,
      `${flavor}_${BUILD_TYPE}_${PROJECT_VERSION}_${BUILD_NUMBER}.apk`
    );
    if (!fs.existsSync(buildApkFile)) {
      throw new Error("Can not find apk file" + buildApkFile);
    }
    fs.copyFileSync(buildApkFile, versionApkFile);
    fs.copyFileSync(buildApkFile, latestApkFile);
    console.log("Build APK: " + buildApkFile);
    console.log("Version APK: " + versionApkFile);
    console.log("Latest APK: " + latestApkFile);
    execSync(
      `java -jar node_modules/app-node-tool/lib/android/walle-cli-all.jar batch -f channel/${flavor}.txt ${buildApkFile} ${APK_DIST}`
    );
  }
  execSync(
    `java -jar node_modules/app-node-tool/lib/android/walle-cli-all.jar batch -f channel/${flavor}.txt ${versionApkFile} ${APK_DIST}`
  );
  execSync(
    `java -jar node_modules/app-node-tool/lib/android/walle-cli-all.jar batch -f channel/${flavor}.txt ${latestApkFile} ${APK_DIST}`
  );
  console.log(`Building channels for ${flavor} successfully`);
}
