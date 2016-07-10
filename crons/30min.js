'use strict';
const _ = require('lodash');
const commandLineArgs = require('command-line-args');

const RedisCache = require('../lib/cache/redis');
const AbstractCron = require('./abstract');

const options = commandLineArgs([{
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
    if (!_.isString(options.CORP_KEY_ID) || !options.CORP_KEY_ID.length
        || !_.isString(options.CORP_VCODE) || !options.CORP_VCODE.length) {
      console.error('error in commandline params');
      process.exit(1);
    }

    const self = this;
    const walletKeys = [
      // 1000,
      1001,
      // 1002,
      // 1003,
      // 1004,
      // 1005,
      // 1006,
    ];
    return new Promise((resolve, reject) => {
      _.forEach(walletKeys).reduce((previousValue, currentValue) => {
        return previousValue
          .then((memo) => {
            let apiOptions = {
              keyID: options.CORP_KEY_ID,
              vCode: options.CORP_VCODE,
              rowCount: 10,
              accountKey: parseInt(currentValue, 10),
            };

            self._fetchWalletJournal(apiOptions)
              .then(() => {
                return true;
              })
              .catch((err) => {
                console.error('_fetchWalletJournal', err);
                return false;
              });
          });
      }, Promise.resolve(false))
        .then((complete) => {
          console.log('complete', complete);
          resolve(complete);
        });
    });
  }

  _fetchWalletJournal(options) {
    const self = this;

    console.log('options', options);

    return self.XmlClient.fetch('corp:WalletJournal', options)
      .then((result) => {

        console.log(result);

        // if (!_.size(result.entries)) {
        //   return true;
        // }
        //
        //
        // _.forEach(result.entries, (value) => {
        //   console.log(value);
        // });

        return true;
      })
      .catch((err) => {
        console.error('corp:WalletJournal', err);
      });
  }

}

const cron = new Cron30Min();
cron.wallet()
  .then(() => {
    console.error('done');
    process.exit();
  });

