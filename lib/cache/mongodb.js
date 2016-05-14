/// <reference path="../../typings/tsd.d.ts" />
'use strict';

const Cache = require('./cache');
const mongoose = require('mongoose');
class MongoDBCache extends Cache {
  constructor(options) {
    super();
    this.model = null;
    this.client = null;
    options = options || {};
    this.setHost(options.host || 'localhost');
    this.setPort(options.port || 27017);
    this.setCollection(options.collection || 'kwevebot');
    this.setPrefix(options.prefix || '');
  }

  getModel() {
    if (this.model === null) {
      const client = this.getClient();
      const DataSchema = new mongoose.Schema({
        data: {
          required: true,
          type: String
        },
        expireAt: {
          required: true,
          type: Date
        },
        hash: {
          index: {
            sparse: true,
            unique: true
          },
          required: true,
          type: String
        }
      }, {
        collection: 'kwevebot'
      });
      this.model = client.model('XMLData', DataSchema);
    }
    return this.model;
  }

  /**
   * Store value in cache.
   *
   * @param {String}   key      Cache key
   * @param {String}   value    Cache Value
   * @param {Number}   duration Number of seconds this cache entry will live
   *
   * @return {Promise<boolean>}
   */
  write(key, value, duration) {
    return new Promise((resolve) => {
      const Model = this.getModel();
      Model.create({
        data: value,
        expireAt: new Date(Date.now() + duration * 1000),
        hash: this.getHashedKey(key)
      });

      resolve(true);
    });
  }

  /**
   * Read Value By Key
   *
   * @param {String} key Cache Key
   * @returns {Promise<string>}
   */
  read(key) {
    return new Promise((resolve) => {
      const hash = this.getHashedKey(key);
      const Model = this.getModel();
      Model.findOne({hash: hash}).exec().then(found => {
        if (found === null) {
          resolve(null);
        } else if (this.getCurrentTime() > Math.floor(new Date(found.expireAt).getTime() / 1000)) {
          Model.remove({hash: found.hash}, err => {
            if (err) {
              console.error(err);
            }
            resolve(null);
          });
        } else {
          resolve(found.data);
        }
      });
    });
  }

  setHost(host) {
    this.host = host;
  }

  getHost() {
    return this.host;
  }

  setPort(port) {
    this.port = port;
  }

  getPort() {
    return this.port;
  }

  setCollection(collection) {
    this.collection = collection;
  }

  getCollection() {
    return this.collection;
  }

  setPrefix(prefix) {
    this.prefix = prefix;
  }

  getPrefix() {
    return this.prefix;
  }

  getClient() {
    if (this.client === null) {
      console.log('generate mongo client');
      const connectData = 'mongodb://' + this.getHost() + ':' + this.getPort() + '/' + this.getPrefix() + this.getCollection();
      this.client = mongoose.connect(connectData, err => {
        if (err) {
          throw err;
        }
      });
    }

    return this.client;
  }

  disconnect() {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
  }
}
module.exports = MongoDBCache;
