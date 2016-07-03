'use strict';

const _ = require('lodash');
const moment = require('moment');

const Helper = require('./helper');

class Wallet {

  constructor(XmlClient) {
    this.XmlClient = XmlClient;

    this.journal = {
      // 1000: {
      //   name: 'Hauptkonto',
      //   in: 0,
      //   out: 0,
      //   diff: 0
      // },
      1001: {
        name: 'Mining & Loot',
        in: 0,
        out: 0,
        diff: 0
      },
      // 1002: {
      //   name: 'Combat',
      //   in: 0,
      //   out: 0,
      //   diff: 0
      // },
      // 1003: {
      //   name: 'Researching',
      //   in: 0,
      //   out: 0,
      //   diff: 0
      // },
      // 1004: {
      //   name: 'Corporation Manufactoring',
      //   in: 0,
      //   out: 0,
      //   diff: 0
      // },
      // 1005: {
      //   name: 'Market Manufactoring',
      //   in: 0,
      //   out: 0,
      //   diff: 0
      // },
      // 1006: {
      //   name: 'Tower Sprit',
      //   in: 0,
      //   out: 0,
      //   diff: 0
      // },
    };
    this.accountKeys = _.keys(this.journal);
  }

  history(keyId, vCode) {
    const self = this;
    const period = Helper.getTimePeriod();

    return new Promise((resolve, reject) => {

      _.keys(self.journal).reduce((previousValue, currentValue) => {
        return previousValue
          .then((memo) => {
            let options = {
              keyID: keyId,
              vCode: vCode,
              rowCount: 2000
            };

            self.in = 0;
            self.out = 0;
            self.refId = null;
            self.lastDate = null;

            options.accountKey = parseInt(currentValue, 10);

            return this._fetchData(options, period, memo[currentValue])
              .then((current) => {

                memo[currentValue].diff = (current.in - current.out).formatISK(2, 3, '.', ',');
                memo[currentValue].in = current.in.formatISK(2, 3, '.', ',');
                memo[currentValue].out = current.out.formatISK(2, 3, '.', ',');

                delete memo[currentValue].refId;
                delete memo[currentValue].lastDate;
                //
                //
                // console.log('current', currentValue, memo[currentValue]);
                // console.log('in', self.in.formatISK(2, 3, '.', ','));
                // console.log('out', self.out.formatISK(2, 3, '.', ','));
                // console.log('diff', (self.in - self.out).formatISK(2, 3, '.', ','))
                return memo;
              });
          });
      }, Promise.resolve(self.journal))
        .then((complete) => {
          console.log('complete', complete, period);
        });

      // self.in = 0;
      // self.out = 0;
      // self.refId = null;
      // self.lastDate = null;
      //
      //
      // this._fetchData(options, period)
      //   .then(() => {
      //     console.log('in', self.in.formatISK(2, 3, '.', ','));
      //     console.log('out', self.out.formatISK(2, 3, '.', ','));
      //     console.log('diff', (self.in - self.out).formatISK(2, 3, '.', ','))
      //   });

    });
  }

  _fetchData(options, period, current) {
    const self = this;

    return new Promise((resolve, reject) => {
      console.log('options', options);

      self.XmlClient.fetch('corp:WalletJournal', options)
        .then((result) => {

          console.log(_.size(result.entries));

          if (!_.size(result.entries)) {
            return resolve(current);
          }

          _.forEach(result.entries, (value) => {
            const journalDate = moment(value.date).format('X');
            if (_.inRange(journalDate, period.start, period.end)) {
              // console.log(value);
              const amount = parseFloat(value.amount);
              if (amount > 0) {
                current.in += amount;
              } else {
                current.out += amount * -1;
              }

              console.log('value', value);
              console.log('in', current.in.formatISK(2, 3, '.', ','));
              console.log('out', current.out.formatISK(2, 3, '.', ','));
            }

            current.refId = value.refID;
            current.lastDate = journalDate;
          });

          if (current.lastDate < period.start) {
            resolve(current);
          }

          options.fromID = current.refId;
          resolve(self._fetchData(options, period, current));
        });
    });
  }
}

module.exports = Wallet;
