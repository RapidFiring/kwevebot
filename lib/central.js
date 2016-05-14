'use strict';

const evejsapi = require('evejsapi');
const _ = require('lodash');

const EveCentralClient = new evejsapi.client.evecentral({
  cache: new evejsapi.cache.redis()
});

const RedisCache = require('./cache/redis');
const cache = new RedisCache({
  socket: '/tmp/redis.sock'
});

class EveCentral {

  constructor() {
    /**
     * @todo in Config auslagern
     */
    this.imageServer = 'https://image.eveonline.com';
    this.eveCentralUrl = 'https://eve-central.com/home/quicklook.html?';

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
    const self = this;

    bot.startPrivateConversation(message, (err, dm) => {
      self.getSavedHub(message.user)
        .then((savedHub) => {
          const hubInfo = message.text.split(/ /);
          if (hubInfo.length === 2) {
            return savedHub;
          } else {
            return self.saveHub(message.user, hubInfo[hubInfo.length - 1]);
          }
        })
        .then((savedHub) => {
          dm.say({
            text: '',
            attachments: [{
              color: 'good',
              title: 'saved Hub: ' + savedHub
            }, EveCentral.hubHelp()]
          });
        })
        .catch((err) => {
          dm.say({
            text: '',
            attachments: [{
              color: 'danger',
              title: 'save failed: ' + err
            }, EveCentral.hubHelp()]
          });
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

      if (this._isValidHub(hub)) {
        const cacheKey = this.cacheNames['hub'] + user;
        cache.write(cacheKey, EveCentral.tradeHubs()[hub], this.cacheTimes['hub'])
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

    const self = this;

    bot.startPrivateConversation(message, (err, dm) => {
      self.getSavedPricetype(message.user)
        .then((savedPricetype) => {
          const priceInfo = message.text.split(/ /);
          if (priceInfo.length === 2) {
            return savedPricetype;
          } else {
            return self.savePricetype(message.user, priceInfo[priceInfo.length - 1]);
          }
        })
        .then((savedPricetype) => {
          dm.say({
            text: '',
            attachments: [{
              color: 'good',
              title: 'saved Price: ' + savedPricetype
            }, EveCentral.pricetypeHelp()]
          });
        })
        .catch((err) => {
          dm.say({
            text: '',
            attachments: [{
              color: 'danger',
              title: 'saved Price failed: ' + err
            }, EveCentral.pricetypeHelp()]
          });
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

      if (this._isValidPricetype(pricetype)) {
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

  _isValidHub(hub) {
    const tradeHubs = EveCentral.tradeHubs();
    return _.has(tradeHubs, hub);
  }

  _isValidPricetype(pricetype) {
    return (_.indexOf(this.validPricetypes, pricetype) !== -1);
  }

  fetch(bot, message, data, sqliteDb) {
    bot.startTyping(message);

    const self = this;
    bot.startPrivateConversation(message, (err, dm) => {
      let hub, hubHumanReadable, pricetype, searchItem;

      Promise.resolve()
        .then(() => {
          if (_.isString(data[2]) && this._isValidPricetype(data[2])) {
            return data[2];
          } else if (_.isString(data[2]) && !this._isValidPricetype(data[2])){
            throw new Error('pricetype is not valid');
          } else {
            return self.getSavedPricetype(message.user)
              .then((_pricetype) => {
                if (_pricetype === 'none') {
                  throw new Error('no saved priceType found!');
                }

                return _pricetype;
              });
          }
        })
        .then((_pricetype) => {
          pricetype = _pricetype;
          if (_.isString(data[3])) {
            data[3] = data[3].toLowerCase();
          }

          if (_.isString(data[3]) && this._isValidHub(data[3])) {
            hubHumanReadable = data[3];
            return EveCentral.tradeHubs()[data[3]];
          } else if (_.isString(data[3]) && !this._isValidHub(data[3])){
            throw new Error('hub is not valid');
          } else {
            return self.getSavedHub(message.user)
              .then((_savedhub) => {
                if (_savedhub === 'none') {
                  throw new Error('no saved hub found!');
                }

                hubHumanReadable = _savedhub;

                return EveCentral.tradeHubs()[_savedhub];
              });
          }
        })
        .then((_hub) => {
          hub = _hub;
          searchItem = data[1].replace(/"/g, '');

          return self._fetchDb(sqliteDb, searchItem);
        })
        .then((typeId) => {
          EveCentralClient.fetch('marketstat', [['typeid', typeId], ['usesystem', hub]])
            .then((data) => {
              const marketStat = data.marketstat.type[pricetype];
              const min = parseFloat(marketStat.min);
              const max = parseFloat(marketStat.max);

              dm.say({
                text: '',
                attachments: [{
                  color: 'good',
                  title: 'Eve-Central ' + hubHumanReadable.capitalize() + ' ' + pricetype.capitalize(),
                  text: '*<' + self.eveCentralUrl + 'typeid=' + typeId + '&usesystem=' + hub + '#sells|' + searchItem.capitalize() + '>' +
                  '*\n_*min*  `' + min.formatISK(2, 3, '.', ',') + ' ISK`_ \n_*max*  `' + max.formatISK(2, 3, '.', ',') + ' ISK`_ \n',
                  thumb_url: self.imageServer + '/Type/' + typeId + '_64.png',
                  mrkdwn_in: [
                    'text'
                  ]
                }]
              });
            });
        })
        .catch((err) => {
          dm.say({
            text: '',
            attachments: [{
              color: 'danger',
              title: 'fetch failed: ' + err
            }]
          });
        });
    });
  }

  _fetchDb(sqliteDb, item) {
    return new Promise((resolve, reject) => {
      sqliteDb.all('SELECT typeID FROM invTypes WHERE typeName = "' + item + '" COLLATE NOCASE', (err, rows) => {
        if (err) {
          return reject(err);
        }

        if (rows.length === 0) {
          return reject('Item not found');
        }

        resolve(rows[0]['typeID']);
      });
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
    return '• [!central] -- command that can return the price of an item or a predefined group'
  }

  static help() {
    return {
      color: "good",
      title: '!central',
      pretext: 'EvE Central Bot Help',
      text: 'this help'
    }
  }

  static hubHelp() {
    return {
      title: '!central hub [<hubname>]',
      text: 'should return the actual tradehub of which the bot should request prices' +
      '\n[<hubname>] can be amarr, jita, dodixie, rens or hek' +
      '\nif <hubname> is entered this tradehub should be set as station for the channel where its entered'
    }
  }

  static pricetypeHelp() {
    return {
      title: '!central price [<pricetype>]',
      text: 'should return the actual pricetype for which the bot should request prices from a hub' +
      '\n[<pricetype>] can either be sell or buy' +
      '\nif <pricetype> is entered this pricetag should be set as pricelist for the channel where its entered'
    }
  }

  static directhelp() {
    return {
      title: '!central "<typename>" [<pricetype>] [<hubname>]',
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
      title: '!central group <groupname> - not implemented yet',
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
