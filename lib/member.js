"use strict";

const _ = require('lodash');
const moment = require('moment');

const evejsapi = require('evejsapi');

class Member {
  constructor(XmlClient) {
    this.XmlClient = XmlClient;
  }

  fetch (bot, message, keyId, vCode) {
    bot.startTyping(message);

    this.XmlClient
      .fetch('corp:MemberTracking', {
        keyID: keyId,
        vCode: vCode,
        extended: true
      })
      .then(result => {

        let i = 0;
        let attachments = [];
        attachments[i] = [];

        const members = _.sortBy(result.members, ['name']);

        _.forEach(members, member => {
          attachments[i].push({
            title: member.name,
            text: member.shipType + ' - ' + (!member.location.length ? 'Citadel ?' : member.location)
          });

          if (JSON.stringify(attachments[i]).length >= 1000) {
            ++i;
            attachments[i] = [];
          }
        });

        const push = function (iterator) {
          if (attachments[iterator]) {
            bot.reply(message, {
              text: iterator === 0 ? 'Member List: cached until: ' + result.cachedUntil : '',
              attachments: attachments[iterator],
              mrkdwn_in: [
                'text'
              ]
            });

            iterator++;
            setTimeout(function () {
              push(iterator);
            }, 1100);
          }
        };

        push(0);
      })
      .catch(err => {
        console.error('error fetching member', err);
      });
  }
}

module.exports = Member;
