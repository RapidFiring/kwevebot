'use strict';

const logger = require('../logger');

try {
  const evejsapi = require('evejsapi');
  const _ = require('lodash');
  const moment = require('moment');

  const RedisCache = require('../lib/cache/redis');
  const options = require('./options.json');

  const cache = new RedisCache();

  class Cron30Min {

    constructor() {
      this.XmlClient = new evejsapi.client.xml({
        cache: new evejsapi.cache.redis(),
      });

      this.cache = cache.getClient();
    }

    wallet() {
      return new Promise((resolve) => {
        if (!_.isString(options.CORP_KEY_ID) || !options.CORP_KEY_ID.length
          || !_.isString(options.CORP_VCODE) || !options.CORP_VCODE.length) {
          logger.error('error in cron options', options);
          return resolve(true);
        }

        const self = this;
        const walletKeys = [
          1000,
          1001,
          1002,
          1003,
          1004,
          1005,
          1006,
        ];

        _.forEach(walletKeys).reduce((previousValue, currentValue) => {
          return previousValue
            .then((memo) => {
              return self._fetchWalletJournal({
                keyID: options.CORP_KEY_ID,
                vCode: options.CORP_VCODE,
                rowCount: 2000,
                accountKey: currentValue,
              })
                .then(() => {
                  return memo;
                });
            });
        }, Promise.resolve(false))
          .then(() => {
            resolve(true);
          });
      });
    }

    _fetchWalletJournal(options) {
      const self = this;

      return new Promise((resolve) => {
        self.XmlClient.fetch('corp:WalletJournal', options)
          .then((result) => {

            const entryCount = _.size(result.entries);
            logger.debug('accountKey: %d, count: %d, fromID: %s', options.accountKey, entryCount, options.fromID || 'n/a');

            if (!entryCount) {
              return resolve(true);
            }

            let lastRefId = null;

            _.forEach(result.entries, (value) => {
              const cacheKey = 'wallet.journal.' + moment(value.date).format('YYYYMM') + '.' + options.accountKey;

              self.cache.hset(cacheKey, value.refID, JSON.stringify(value));
              lastRefId = value.refID;
            });

            if (entryCount < options.rowCount) {
              return resolve(true);
            }

            options.fromID = lastRefId;
            setTimeout(resolve(self._fetchWalletJournal(options)), 1000);
          })
          .catch(err => {
            logger.error('error while fetching data: ' + err);
          });
      });
    }
  }

  const cron = new Cron30Min();
  Promise.all([
    cron.wallet(),
  ])
    .then(() => {
      setTimeout(process.exit(), 1000);
    });
} catch(e) {
  logger.error(e.message);
}
