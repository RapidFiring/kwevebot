'use strict';

const evejsapi = require('evejsapi');

class CronAbstract {
  constructor() {
    this.XmlClient = new evejsapi.client.xml({
      cache: new evejsapi.cache.redis(),
    });
  }

}

module.exports = CronAbstract;
