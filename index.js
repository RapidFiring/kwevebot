'use strict';

if (!process.env.SLACK_API_TOKEN) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

const os = require('os');

const Botkit = require('botkit');
const controller = Botkit.slackbot({
    debug: false,
});

controller.spawn({
    token: process.env.SLACK_API_TOKEN || ''
}).startRTM();

controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {

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

controller.hears(['help'], 'direct_message,direct_mention,mention', function(bot, message) {

  bot.reply(message, {
    text: 'I am a bot named <@' + bot.identity.name + '>',
    attachments: require('./lib/help')
  });
});

controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function(bot, message) {

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

    return  uptime + ' ' + unit;
}
