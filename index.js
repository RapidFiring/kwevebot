'use strict';

if (!process.env.SLACK_API_TOKEN) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

const os = require('os');
const evejsapi = require('evejsapi');

const cache = new evejsapi.cache.redis();

const XmlClient = new evejsapi.client.xml({
  cache: new evejsapi.cache.redis(),
});

const Botkit = require('botkit');
const controller = Botkit.slackbot({
  debug: false,
});

controller.spawn({
  token: process.env.SLACK_API_TOKEN || ''
}).startRTM();

controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function (bot, message) {

  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face',
  }, function (err) {
    if (err) {
      bot.botkit.log('Failed to add emoji reaction :(', err);
    }
  });

});

controller.hears(['serverStatus'], 'direct_message,direct_mention,mention', function (bot, message) {

  XmlClient.fetch('server:ServerStatus')
    .then((data) => {

      const status = data.serverOpen === 'True' ? 'Open' : 'Closed';

      bot.reply(message, {
        "attachments": [{
          "title": "Server",
          "pretext": "EvE Online Server Status",
          "text": "\t" + status,
          "mrkdwn_in": [
            "text",
            "pretext"
          ]
        }, {
          "title": "Online Player",
          "text": "\t" + data.onlinePlayers,
          "mrkdwn_in": [
            "text"
          ]
        }]
      });
    })
    .catch((err) => {
      bot.reply(message, {
        text: 'can not fetch serverStatus (' + err + ')'
      });
    })
  ;
});

controller.hears(['^central$', '(^help)'], 'direct_message,direct_mention,mention', function (bot, message) {

  bot.reply(message, {
    attachments: require('./lib/central').help
  });
});

controller.hears(['^central hub'], 'direct_message,direct_mention,mention', function(bot, message) {

  const cacheKey = cache.getHashedKey(message.user + 'central hub');
  const hubInfo = message.text.split(/ /);

  cache.read(cacheKey)
    .then((data) => {
      if (data !== null) {}
      console.info('read', data, hubInfo);
    })
    .catch(console.error);

  console.info(message, cache.getHashedKey(message.user + 'central hub'));

});

controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
  'direct_message,direct_mention,mention', function (bot, message) {

    const hostname = os.hostname();
    const uptime = formatUptime(process.uptime());

    bot.reply(message,
      ':robot_face: I am a bot named <@' + bot.identity.name +
      '>. I have been running for ' + uptime + ' on ' + hostname + '.');

  });

function formatUptime(uptime) {
  let unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }

  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }

  if (uptime !== 1) {
    unit = unit + 's';
  }

  return uptime + ' ' + unit;
}
