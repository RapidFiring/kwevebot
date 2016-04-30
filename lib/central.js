'use strict';

module.exports = {
  help: [{
    title: 'central / help',
    pretext: 'EvE Central Bot Help',
    text: 'this help'
  }, {
    title: 'central hub [<hubname>]',
    text: 'should return the actual tradehub of which the bot should request prices' +
    '\n[<hubname>] can be amarr, jita, dodixie, rens or hek' +
    '\nif <hubname> is entered this tradehub should be set as station for the channel where its entered'
  }, {
    title: 'central price [<pricetype>]',
    text: 'should return the actual pricetype for which the bot should request prices from a hub' +
    '\n[<pricetype>] can either be sell or buy' +
    '\nif <pricetype> is entered this pricetag should be set as pricelist for the channel where its entered'
  }, {
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
  }]
};
