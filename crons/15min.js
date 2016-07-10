'use strict';
const _ = require('lodash');

const AbstractCron = require('./abstract');

class Cron15Min extends AbstractCron {

  constructor() {
    super();
  }

  wallet() {
    console.log(this.XmlClient);
  }

}

const cron = new Cron15Min();
cron.wallet();

process.exit();
