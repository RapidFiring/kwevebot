'use strict';

const _ = require('lodash');
const Helper = require('./helper');

class Industry {

  constructor(XmlClient) {

    this.XmlClient = XmlClient;

    this._jobHistory = {
      1: {
        name: 'Production',
        color: '#ffcc00',
        statistic: []
      },
      3: {
        name: 'TE',
        color: '#0000ff',
        statistic: []
      },
      4: {
        name: 'ME',
        color: '#009900',
        statistic: []
      },
      5: {
        name: 'Copy',
        color: '#000000',
        statistic: []
      },
      8: {
        name: 'Invention',
        color: '#595959',
        statistic: []
      }
    };
  }

  history(keyId, vCode) {
    return new Promise((resolve) => {
      try {
        var d = new Date().SubtractMonth(1);

        this.XmlClient.fetch('corp:IndustryJobsHistory', {
          keyID: keyId,
          vCode: vCode
        })
          .then((jobHistory) => {
            const cachedUntil = jobHistory.cachedUntil;
            const jobsMonth = _.filter(jobHistory.jobs, (job) => {
              return (d.getMonth()) === (new Date(job.endDate).getMonth());
            });

            const jobs = _.orderBy(jobsMonth, ['endDate']);

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

            }, Promise.resolve(this._jobHistory))
              .then((complete) => {
                let attachments = [];

                _.forEach(complete, (jobs) => {
                  const sortJobs = _.orderBy(jobs.statistic, ['count'], ['desc']);
                  let attachmentText = '';

                  _.forEach(sortJobs, (job) => {
                    attachmentText += job.characterName+'\t'+job.count+'\t'+job.cost.formatISK(2, 3, '.', ',') + ' ISK\n';
                  });

                  attachments.push({
                    color: jobs.color,
                    title: 'Activity Type: ' + jobs.name,
                    text: attachmentText
                  });
                });

                resolve({
                  text: 'Industry History ' + d.getFullYear() + '-' + String("00" + (d.getMonth() + 1)).slice(-2) + ', chachedUntil: ' + cachedUntil + ' eveTime',
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
}

module.exports = Industry;
