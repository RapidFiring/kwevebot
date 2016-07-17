'use strict';

const evejsapi = require('evejsapi');
const _ = require('lodash');
const moment = require('moment');

const Helper = require('./helper');

class Wallet {

  constructor(XmlClient) {
    this.XmlClient = XmlClient;
    this.cache = new evejsapi.cache.redis();

    this.journal = {
      1000: {
        name: 'Hauptkonto',
        start: 0,
        end: 0,
        diff: 0
      },
      1001: {
        name: 'Mining & Loot',
        start: 0,
        end: 0,
        diff: 0
      },
      1002: {
        name: 'Combat',
        start: 0,
        end: 0,
        diff: 0
      },
      1003: {
        name: 'Researching',
        start: 0,
        end: 0,
        diff: 0
      },
      1004: {
        name: 'Corporation Manufactoring',
        start: 0,
        end: 0,
        diff: 0
      },
      1005: {
        name: 'Market Manufactoring',
        start: 0,
        end: 0,
        diff: 0
      },
      1006: {
        name: 'Tower Sprit',
        start: 0,
        end: 0,
        diff: 0
      },
    };
  }

  history(_period) {
    const self = this;
    const period = Helper.getTimePeriod(_period);

    return new Promise((resolve) => {

      _.keys(self.journal).reduce((previousValue, currentValue) => {
        return previousValue
          .then((memo) => {
            let options = {
              accountKey: parseInt(currentValue, 10)
            };

            return this._fetchData(options, period, memo[currentValue])
              .then(() => {
                return memo;
              });
          });
      }, Promise.resolve(self.journal))
        .then((complete) => {
          let attachments = [];

          _.forEach(complete, (value) => {
            let attachmentText = '';

            attachmentText += 'Start: ' + parseFloat(value.start).formatISK(2, 3, '.', ',')
              + '\nEnd: ' + parseFloat(value.end).formatISK(2, 3, '.', ',')
              + '\nDiff: ' + parseFloat(value.diff).formatISK(2, 3, '.', ',');

            attachments.push({
              color: (value.diff > 0) ? 'good' : 'danger',
              title: value.name,
              text: attachmentText || 'no Data'
            });
          });

          resolve({
            text: 'Wallet History\t' + period.startHuman + ' : ' + period.endHuman,
            attachments: attachments,
            mrkdwn_in: [
              'text'
            ]
          });
        });
    });
  }

  _fetchData(options, period, current, periodKey) {
    const self = this;

    if (periodKey === undefined) {
      periodKey = period.startYearMonth;
    }

    return new Promise((resolve) => {
      const cacheKey = 'wallet.journal.' + periodKey + '.' + options.accountKey;

      self.cache.getClient().hgetall(cacheKey,  (err, result) => {
        if (err) {
          return resolve(current);
        }

        let data = [];
        _.forEach(result, (value) => {
          let _data = JSON.parse(value);

          const journalDate = moment(_data.date).format('X');
          if (_.inRange(journalDate, period.start, period.end)) {
            data.push(_data);
          }
        });

        data = _.orderBy(data, ['date'], ['asc']);

        if (data.length) {
          current.start = data[0].balance;
          current.end = data[data.length - 1].balance;
          current.diff = (current.end - current.start);
        }

        if (periodKey !== period.endYearMonth) {
          return resolve(self._fetchData(options, period, current, period.endYearMonth));
        }

        resolve(current);
      });
    });
  }
}

module.exports = Wallet;
