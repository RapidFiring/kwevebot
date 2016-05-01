'use strict';

const evejsapi = require('evejsapi');
const RedisCache = require('./cache/redis');
const cache = new RedisCache({
  socket: '/tmp/redis.sock'
});
const _ = require('lodash');

class EveCentral {

  constructor() {
    this.validPricetypes = ['sell', 'buy'];

    this.cacheNames = {
      hub: 'central:hub:',
      price: 'central:price:'
    };

    this.cacheTimes = {
      hub: 2592000, // 30 days
      price: 2592000 // 30 days
    };
  }

  hub(bot, message) {
    bot.startTyping(message);

    this.getSavedHub(message.user)
      .then((savedHub) => {
        const hubInfo = message.text.split(/ /);
        if (hubInfo.length === 2) {
          return savedHub;
        } else {
          return this.saveHub(message.user, hubInfo[hubInfo.length - 1]);
        }
      })
      .then((savedHub) => {
        bot.reply(message, {
          attachments: [{
            color: 'good',
            title: 'saved Hub: ' + savedHub
          }, EveCentral.hubHelp()]
        });
      })
      .catch((err) => {
        bot.reply(message, {
          attachments: [{
            color: 'danger',
            title: 'save failed: ' + err
          }, EveCentral.hubHelp()]
        });
      });
  }

  getSavedHub(user) {
    return new Promise((resolve, reject) => {
      const cacheKey = this.cacheNames['hub'] + user;
      cache.read(cacheKey)
        .then((hub) => {
          if (hub !== null) {
            resolve(_.invert(EveCentral.tradeHubs())[hub]);
          } else {
            resolve('none');
          }
        })
        .catch(reject);
    });
  }

  saveHub(user, hub) {
    return new Promise((resolve, reject) => {
      hub = hub.toLowerCase();

      const tradeHubs = EveCentral.tradeHubs();
      if (_.has(tradeHubs, hub)) {
        const cacheKey = this.cacheNames['hub'] + user;
        cache.write(cacheKey, tradeHubs[hub], this.cacheTimes['hub'])
          .then(() => {
            resolve(hub);
          })
          .catch(reject);
      } else {
        resolve('none');
      }
    });
  }

  pricetype(bot, message) {
    bot.startTyping(message);

    this.getSavedPricetype(message.user)
      .then((savedPricetype) => {
        const priceInfo = message.text.split(/ /);
        if (priceInfo.length === 2) {
          return savedPricetype;
        } else {
          return this.savePricetype(message.user, priceInfo[priceInfo.length - 1]);
        }
      })
      .then((savedPricetype) => {
        bot.reply(message, {
          attachments: [{
            color: 'good',
            title: 'saved Price: ' + savedPricetype
          }, EveCentral.pricetypeHelp()]
        });
      })
      .catch((err) => {
        bot.reply(message, {
          attachments: [{
            color: 'danger',
            title: 'saved Price failed: ' + err
          }, EveCentral.pricetypeHelp()]
        });
      });
  }

  getSavedPricetype(user) {
    return new Promise((resolve) => {
      const cacheKey = this.cacheNames['price'] + user;
      cache.read(cacheKey)
        .then((hub) => {
          resolve(hub || 'none');
        });
    });
  }

  savePricetype(user, pricetype) {
    return new Promise((resolve) => {
      pricetype = pricetype.toLowerCase();

      if (_.indexOf(this.validPricetypes, pricetype) !== -1) {
        const cacheKey = this.cacheNames['price'] + user;
        cache.write(cacheKey, pricetype, this.cacheTimes['price'])
          .then(() => {
            resolve(pricetype);
          });
      } else {
        resolve('none');
      }
    });
  }

  static tradeHubs() {
    return {
      jita: '30000142',
      hek: '30002053',
      amarr: '30002187',
      rens: '30002510',
      dodixie: '30002659'
    }
  }

  static globalHelp() {
    return '• [central] -- command that can return the price of an item or a predefined group'
  }

  static help() {
    return {
      color: "good",
      title: 'central',
      pretext: 'EvE Central Bot Help',
      text: 'this help'
    }
  }

  static hubHelp() {
    return {
      title: 'central hub [<hubname>]',
      text: 'should return the actual tradehub of which the bot should request prices' +
      '\n[<hubname>] can be amarr, jita, dodixie, rens or hek' +
      '\nif <hubname> is entered this tradehub should be set as station for the channel where its entered'
    }
  }

  static pricetypeHelp() {
    return {
      title: 'central price [<pricetype>]',
      text: 'should return the actual pricetype for which the bot should request prices from a hub' +
      '\n[<pricetype>] can either be sell or buy' +
      '\nif <pricetype> is entered this pricetag should be set as pricelist for the channel where its entered'
    }
  }

  static directhelp() {
    return {
      title: 'central "<typename>" [<pricetype>] [<hubname>] - not implemented yet',
      text: 'should return the actual price from the eve-central - api.' +
      '\n*"<typename>"* type of good that should be check with the eve-central-api' +
      '\n*must be within quotation marks* so the typename can be validated to the typename/typeid lookuptable.' +
      '\n[<pricetype>] can either be sell or buy' +
      '\n[<hubname>] can be amarr, jita, dodixie, rens or hek' +
      '\nif <pricetype> is entered the api should return the price for the requested pricetag, ignoring the standard pricetag set for this channel.' +
      '\nif <hubname> is entered the api should return the price for the requested hub, ignoring the standard hub set for this channel.',
      mrkdwn_in: [
        'text'
      ]
    }
  }

  static groupHelp() {
    return {
      title: 'central group <groupname> - not implemented yet',
      text: 'should return a grouped pricelist for a special group ' +
      '<groupname> can be ore, cpore, minerals, p1, p2, p3, p4, ... (can be extendend)',
      mrkdwn_in: [
        'text'
      ]
    }
  }

  static allHelp() {
    return [
      EveCentral.help(),
      EveCentral.hubHelp(),
      EveCentral.pricetypeHelp(),
      EveCentral.directhelp(),
      EveCentral.groupHelp()
    ];
  }
}

module.exports = EveCentral;
