'use strict';

const evejsapi = require('evejsapi');
const _ = require('lodash');

const cache = new evejsapi.cache.redis();

class EveCentral {

  constructor() {
    this.cacheNames = {
      hub: 'central.hub.',
      price: 'central.price.'
    }

    this.cacheTimes = {
      hub: 2592000, // 30 days
      price: 2592000 // 30 days
    }
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
  
  static tradeHubs() {
    return {
      jita: '30000142',
      hek: '30002053',
      amarr: '30002187',
      rens: '30002510',
      dodixie: '30002659'
    }
  }

  static help() {
    return {
      title: 'central / help',
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
      title: 'central "<typename>" [<pricetype>] [<hubname>]',
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

  static allHelp() {
    return [
      EveCentral.help(),
      EveCentral.hubHelp(),
      EveCentral.pricetypeHelp(),
      EveCentral.directhelp()
    ];
  }
}

module.exports = EveCentral;
