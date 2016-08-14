'use strict';
try {

  const _ = require('lodash');
  const mongoose = require('mongoose');

  const logger = require('../logger');
  const CronAbstract = require('./abstract');
  const options = require('./options.json');

  mongoose.Promise = Promise;

  mongoose.connect(options.MONGODB_URI);
  mongoose.connection.on('error', () => {
    console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
    process.exit(1);
  });

  const JobHistory = require('../lib/models/jobHistory');

  class Cron6Hours extends CronAbstract {
    industryHistorie() {
      return new Promise((resolve) => {
        if (!_.isString(options.CORP_KEY_ID) || !options.CORP_KEY_ID.length
          || !_.isString(options.CORP_VCODE) || !options.CORP_VCODE.length) {
          logger.error('error in cron options', options);
          return resolve(true);
        }

        this.XmlClient.fetch('corp:IndustryJobsHistory', {
          keyID: options.CORP_KEY_ID,
          vCode: options.CORP_VCODE,
        })
          .then((jobHistory) => {
            let jobs = _.values(jobHistory.jobs);
            let count = jobs.length;

            jobs.reduce((previousValue, currentValue) => {
              return previousValue.then((memo) => {
                return this._findOrSave(currentValue).then(() => {
                  return ++memo;
                });
              });
            }, Promise.resolve(0))
              .then((complete) => {
                logger.debug('industryHistorie complete', complete, count);
                resolve(true);
              });
          })
          .catch(err => {
            logger.error('(catch) corp:IndustryJobsHistory', err);
            console.error('(catch) corp:IndustryJobsHistory', err);
            resolve(true);
          });
      });
    }

    _findOrSave(data) {

      return new Promise((resolve) => {

        JobHistory.findOne({jobID: data.jobID}, 'jobId', (err, job) => {
          if (job === null) {
            JobHistory.create(data, (err) => {
              if (err) {
                logger.error('error while create industryHistorie', err);
              }

              resolve(true);
            });
          } else {
            JobHistory.update({jobID: data.jobID}, { $set: data }, (err) => {
              if (err) {
                logger.error('error while update industryHistorie', err);
              }

              resolve(true);
            });
          }
        });
      });
    }
  }

  const cron = new Cron6Hours();
  Promise.all([
    cron.industryHistorie(),
  ])
    .then(() => {
      setTimeout(() => {
        process.exit();
      }, 5000);
    });
} catch (e) {
  console.error('try/catch', e.message);
}
