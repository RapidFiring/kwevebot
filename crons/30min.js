'use strict';
const _ = require('lodash');
const commandLineArgs = require('command-line-args');

const RedisCache = require('../lib/cache/redis');
const AbstractCron = require('./abstract');

const options = commandLineArgs([{
  name: 'SLACK_API_TOKEN',
  type: String,
  defaultValue: ''
}, {
  name: 'CORP_KEY_ID',
  type: String,
  defaultValue: ''
}, {
  name: 'CORP_VCODE',
  type: String,
  defaultValue: ''
}]);
const cache = new RedisCache();

class Cron30Min extends AbstractCron {

  constructor() {
    super();
  }

  wallet() {
    console.log(this.XmlClient);
    console.log(options);
  }

}

const cron = new Cron30Min();
cron.wallet();

process.exit();

// SLACK_API_TOKEN=xoxb-43193264949-n8PJGlNmp0iHeMSBJCBL0KWG CORP_KEY_ID=2924405 CORP_VCODE=zd6XGV82MfiFs9KsIVUzjiXHmzNIvvA5AruDKGOfhltaQjKtO1LTX2UdiHNgob9X
