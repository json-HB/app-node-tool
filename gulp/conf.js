/* global process */

const _ = require('underscore'),
  fs = require('fs'),
  path = require('path');

const DEFAULT_CONFIG = require('../config');

const ENV = DEFAULT_CONFIG.envs[process.env.NODE_ENV]
  ? process.env.NODE_ENV
  : 'local';
const BRAND_NAME = DEFAULT_CONFIG.brands[process.env.BRAND_NAME]
  ? process.env.BRAND_NAME
  : 'Kredito';

let config;
try {
  config = require(path.resolve('./config'));
} catch (e) {
  config = {};
}

const conf = (function () {
  const defaultConf = Object.assign(
    {},
    DEFAULT_CONFIG,
    DEFAULT_CONFIG.envs[ENV]
  );
  const defaultBrandConf = getBrandConfig(DEFAULT_CONFIG);
  const brandConf = getBrandConfig(config);
  const conf = _.omit(
    Object.assign(
      {},
      defaultConf,
      config,
      config.envs && config.envs[ENV],
      defaultBrandConf,
      brandConf
    ),
    ['envs', 'brands']
  );

  // overwrite config from command line
  for (const p in conf) {
    if (process.env[p]) {
      conf[p] = process.env[p];
    }
  }

  function getBrandConfig(config) {
    const conf = config.brands && config.brands[BRAND_NAME];
    if (!conf) {
      return {};
    }
    return Object.assign({}, conf, conf.envs && conf.envs[ENV]);
  }

  return conf;
})();

conf.BUILD_TIME = new Date().toISOString();
conf.BRAND_NAME = BRAND_NAME;
conf.ENV = ENV;
conf.IS_PRODUCTION = ENV == 'production';

let ossAccessKey = null;
conf.getOssAccessKey = function () {
  if (ossAccessKey) {
    return ossAccessKey;
  }
  const id = process.env.OSS_ACCESS_KEY_ID;
  const secret = process.env.OSS_ACCESS_KEY_SECRET;
  if (id && secret) {
    ossAccessKey = {
      id: id,
      secret: secret
    };
  } else {
    const accessKeyPath
      = (conf.oss && conf.oss.accessKeyPath)
      || '/usr/local/etc/lepin/oss-access-key';
    if (!fs.existsSync(accessKeyPath)) {
      throw new Error(
        'OSS access key file "' + accessKeyPath + '" does not exist!'
      );
    }
    const content = fs.readFileSync(accessKeyPath).toString();
    const keys = content.split('\n')[0].split(' ');
    ossAccessKey = {
      id: keys[0],
      secret: keys[1]
    };
  }
  return ossAccessKey;
};

module.exports = conf;
