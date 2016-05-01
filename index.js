'use strict';

if (!process.env.SLACK_API_TOKEN) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

String.prototype.capitalize = function(){
  return this.toLowerCase().replace( /\b\w/g, function (m) {
    return m.toUpperCase();
  });
};

Number.prototype.formatISK = function(n, x, s, c) {
  var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
    num = this.toFixed(Math.max(0, ~~n));

  return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
};

const os = require('os');
const evejsapi = require('evejsapi');

const Help = require('./lib/help');
const EveCentral = require('./lib/central');
const eveCentral = new EveCentral();

const XmlClient = new evejsapi.client.xml({
  cache: new evejsapi.cache.redis(),
});

const Botkit = require('botkit');
const controller = Botkit.slackbot({
  logLevel: process.env.LOG_LEVEL || info,
  // storage: require('./node_modules/botkit/lib/storage/redis_storage')
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/sqlite-latest.sqlite');
db.serialize(() => {
  controller.spawn({
    token: process.env.SLACK_API_TOKEN || ''
  }).startRTM();
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

controller.hears(['^help$', '^hi$', '^hello$'], 'direct_message,direct_mention,mention', function (bot, message) {
  bot.identifyBot((err, botInfo) => {
    console.log(botInfo, message);
  });
  bot.reply(message, {
    attachments: [{
      pretext: 'Hello, im your sister of EVE™ bot for slack. These are your available commands at the moment in this channel.',
      title: '• [hello], [hi] -- greets you\n' +
      EveCentral.globalHelp() + '\n' +
      '• [serverStatus] -- command returns the server status',
      mrkdwn_in: [
        "text",
        "pretext"
      ]
    }]
  });
});

controller.hears(['^central$'], 'direct_message,direct_mention,mention', function (bot, message) {
  bot.reply(message, {
    attachments: EveCentral.allHelp()
  });
});

controller.hears(['^central hub'], 'direct_message,direct_mention,mention', (bot, message) => {
  eveCentral.hub(bot, message);
});

controller.hears(['^central price'], 'direct_message,direct_mention,mention', (bot, message) => {
  eveCentral.pricetype(bot, message);
});

controller.hears(['^central'], 'direct_message', (bot, message) => {
  const search = message.text.match(/("?([a-zA-Z0-9'\-\s]\w+)*")|(\w+)/g);

  if (search.length > 4 || message.text.indexOf('"') === -1) {
    bot.reply(message, {
      attachments: [{
        color: 'danger',
        title: 'Parameter Match failed'
      }]
    });
  } else {
    eveCentral.fetch(bot, message, search, db);
  }
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

  return uptime.toFixed(2) + ' ' + unit;
}
