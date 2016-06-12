'use strict';

if (!process.env.SLACK_API_TOKEN) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

const evejsapi = require('evejsapi');

const Helper = require('./lib/helper');
const EveCentral = require('./lib/central');
const eveCentral = new EveCentral();

const XmlClient = new evejsapi.client.xml({
  cache: new evejsapi.cache.redis(),
});

const Botkit = require('botkit');
const controller = Botkit.slackbot({
  logLevel: process.env.LOG_LEVEL || info,
  storage: require('botkit-storage-redis')()
});

const IndustryClass = require('./lib/industry');
const industry = new IndustryClass(XmlClient);

const keyId = process.env.CORP_KEY_ID || null;
const vCode = process.env.CORP_VCODE || null;

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/sqlite-latest.sqlite');
db.serialize(() => {
  controller.spawn({
    token: process.env.SLACK_API_TOKEN || ''
  }).startRTM();
});

controller.on('hello', (bot) => {
  console.info('Bot started and ping every 120sec');
  setInterval(() => {
    bot.rtm.ping();
  }, 120000);

});

controller.hears(['^!serverstatus$', '^!server$', '^!ServerStatus$'], 'ambient,direct_message', (bot, message) => {
  bot.startTyping(message);

  XmlClient.fetch('server:ServerStatus')
    .then((data) => {
      bot.reply(message, {
        'attachments': [{
          'fallback': 'ServerStatus - Status couldn\'t be verified:',
          'title': 'EvE Online Server Status',
          'fields': [{
            'title': 'Tranquility',
            'value': '\t' + (data.serverOpen === 'True' ? 'Online' : 'Offline'),
            'short': true
          }, {
            'title': 'Online Player',
            'value': '\t' + data.onlinePlayers,
            'short': true
          }],
          'color': data.serverOpen === 'True' ? 'good' : 'danger'
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

controller.hears(['^hi', '^hello', '^help'], 'direct_message', (bot, message) => {
  bot.startTyping(message);

  bot.reply(message, {
    text: 'Hello, im your sister of EVE™ bot for slack. These are your available commands at the moment in this channel.',
    attachments: [{
      color: 'good',
      title: '• [hello], [hi], [help] -- greets you\n' +
      EveCentral.globalHelp() + '\n' +
      '• [serverStatus] -- command returns the server status',
      mrkdwn_in: [
        'title'
      ]
    }]
  });
});

controller.hears(['^!central$'], 'direct_message', (bot, message) => {
  bot.startTyping(message);

  bot.reply(message, {
    text: '',
    attachments: EveCentral.allHelp()
  });
});

controller.hears(['^!central hub'], 'direct_message', (bot, message) => {
  eveCentral.hub(bot, message);
});

controller.hears(['^!central price'], 'direct_message', (bot, message) => {
  eveCentral.pricetype(bot, message);
});

controller.hears(['^!central'], 'direct_message', (bot, message) => {
  bot.startTyping(message);

  const search = message.text.match(/([\""].+?[\""]|[^ ]+)/g);

  if (search.length > 4 || message.text.indexOf('"') === -1) {
    bot.reply(message, {
      text: '',
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
  'direct_message,direct_mention,mention,ambient', (bot, message) => {

    const uptime = Helper.formatUptime(process.uptime());

    bot.reply(message,
      ':robot_face: I am a bot named <@' + bot.identity.name +
      '>. I have been running for ' + uptime + '.');
  });

controller.hears(['^!industry-history$'], 'direct_message', (bot, message) => {
  bot.startTyping(message);

  if (keyId === null || vCode === null) {
    bot.reply(message, {
      text: '',
      attachments: [{
        color: 'danger',
        title: 'keyId or vCode not set by start'
      }]
    });
  } else {
    industry.history(keyId, vCode)
      .then((reply) => {
        bot.reply(message, reply);
      });
  }
});

controller.hears(['^!industry$'], 'direct_message', (bot, message) => {
  bot.startTyping(message);

  if (keyId === null || vCode === null) {
    bot.reply(message, {
      text: '',
      attachments: [{
        color: 'danger',
        title: 'keyId or vCode not set by start'
      }]
    });
  } else {
    industry.now(keyId, vCode)
      .then((reply) => {
        bot.reply(message, reply);
      })
      .catch(err => {
        bot.reply(message, {
          text: '',
          attachments: [{
            color: 'danger',
            text: err
          }]
        });
      });
  }
});
