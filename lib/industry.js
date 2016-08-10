'use strict';

const _ = require('lodash');
const moment = require('moment');

const Helper = require('./helper');

class Industry {

  constructor(XmlClient) {

    this.XmlClient = XmlClient;

  }

  initJobs() {
    this._jobs = {
      1: {
        name: 'Production',
        color: '#ffcc00',
        statistic: [],
        data: [],
        refund: 175000,
      },
      3: {
        name: 'TE',
        color: '#0000ff',
        statistic: [],
        data: [],
        refund: 75000,
      },
      4: {
        name: 'ME',
        color: '#009900',
        statistic: [],
        data: [],
        refund: 75000,
      },
      5: {
        name: 'Copy',
        color: '#000000',
        statistic: [],
        data: [],
        refund: 125000,
      },
      8: {
        name: 'Invention',
        color: '#595959',
        statistic: [],
        data: [],
        refund: 150000,
      }
    };
  }

  history(keyId, vCode, period) {
    this.initJobs();
    return new Promise((resolve) => {
      try {

        let timePeriod = Helper.getTimePeriod(period);

        this.XmlClient.fetch('corp:IndustryJobsHistory', {
          keyID: keyId,
          vCode: vCode
        })
          .then((jobHistory) => {
            let cachedUntil = jobHistory.cachedUntil;
            let filteredJobs = _.filter(jobHistory.jobs, (job) => {
              let jobDate = moment(job.endDate).format('X');
              return jobDate >= timePeriod.start && jobDate <= timePeriod.end;
            });

            let jobs = _.orderBy(filteredJobs, ['endDate']);

            jobs.reduce((previousValue, currentValue) => {

              return previousValue
                .then((memo) => {

                  currentValue.cost = parseFloat(currentValue.cost);

                  let search = _.findIndex(memo[currentValue.activityID].statistic, {
                    characterID: currentValue.installerID
                  });

                  if (search === -1) {
                    memo[currentValue.activityID].statistic.push({
                      characterID: currentValue.installerID,
                      characterName: currentValue.installerName,
                      count: 1,
                      cost: currentValue.cost
                    });
                  } else {
                    memo[currentValue.activityID].statistic[search].count++;
                    memo[currentValue.activityID].statistic[search].cost += currentValue.cost;
                  }

                  return memo;
                });

            }, Promise.resolve(this._jobs))
              .then((complete) => {
                let attachments = [];
                let refunds = [];

                _.forEach(complete, (jobs, activityID) => {

                  let sortJobs = _.orderBy(jobs.statistic, ['count'], ['desc']);
                  let attachmentText = '';

                  _.forEach(sortJobs, (job) => {
                    if (period === 'lastMonth') {
                      let search = _.findIndex(refunds, {characterID: job.characterID});
                      if (search === -1) {
                        refunds.push({
                          characterID: job.characterID,
                          characterName: job.characterName,
                          refund: job.count * this._jobs[activityID].refund
                        })
                      } else {
                        refunds[search].refund += job.count * this._jobs[activityID].refund;
                      }
                    }

                    attachmentText += job.characterName + '\t' + job.count + '\t' + job.cost.formatISK(2, 3, '.', ',') + ' ISK\n';
                  });

                  attachments.push({
                    color: jobs.color,
                    title: 'Activity Type: ' + jobs.name,
                    text: attachmentText || 'no Jobs'
                  });
                });

                let refundText = '';
                _.forEach(_.orderBy(refunds, ['refund'], ['desc']), refund => {
                  refundText += refund.characterName+'\t'+refund.refund.formatISK(2, 3, '.', ',') + ' ISK\n';
                });

                if (refundText.length) {
                  attachments.push({
                    color: '#FF00CC',
                    title: 'Refund:',
                    text: refundText || 'no Refund'
                  });
                }

                resolve({
                  text: 'Industry History\nFrom: ' + timePeriod.startHuman + '\nUntil: ' + timePeriod.endHuman + '\nchachedUntil: ' + cachedUntil + ' eveTime',
                  attachments: attachments,
                  mrkdwn_in: [
                    'text'
                  ]
                });
              });
          });
      } catch (e) {
        resolve({
          title: 'Error while fetching Industry Jobs',
          text: e.message
        });
      }
    });
  }

  now(keyId, vCode) {
    this.initJobs();
    return new Promise((resolve, reject) => {
      let self = this;
      let cachedUntil;

      try {
        this.XmlClient.fetch('corp:IndustryJobs', {
          keyID: keyId,
          vCode: vCode
        })
          .then((result) => {
            cachedUntil = result.cachedUntil;

            _.forEach(result.jobs, (value) => {
              self._jobs[value.activityID].data.push(value);
            });

            let attachments = [];

            _.forEach(self._jobs, (jobs) => {
              let sortJobs = _.orderBy(jobs.data, ['endDate'], ['asc']);
              let attachmentText = '';

              _.forEach(sortJobs, (job) => {
                attachmentText += moment(job.endDate).format('YYYY-MM-DD HH:mm')+'\t'+job.licensedRuns+'\t'+job.installerName + '\t' + job.productTypeName + '\n';
              });

              if (attachmentText.length === 0) {
                attachmentText = 'no Jobs';
              }

              attachments.push({
                color: jobs.color,
                title: jobs.name,
                text: attachmentText
              });
            });

            let resolveData = {
              text: 'Current Industry Jobs, chachedUntil: ' + cachedUntil + ' eveTime',
              attachments: attachments
            };

            if (JSON.stringify(resolveData).length >= 4000) {
              console.error('characters', JSON.stringify(resolveData).length);
              return reject('more then 4000 characters will be shown. Please inform the programmer about this.')
            }

            resolve(resolveData);
          });

      } catch (e) {
        reject(e.message);
      }
    });
  }

  static globalHelp() {
    return '• [!industry] -- command that ca return all actual industry jobs\n' +
      '• [!industry-history] [lastMonth|lastWeek|last2Weeks] -- command tha can return all complete industry jobs';
  }
}

module.exports = Industry;
