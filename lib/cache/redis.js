/// <reference path="../../typings/tsd.d.ts" />
'use strict';

const redis = require('redis');
const Cache = require('./cache');
class RedisCache extends Cache {
    constructor(options) {
        super();
        options = options || {};
        if (options.socket) {
            this.setSocket(options.socket);
        } else {
            this.setHost(options.host || 'localhost');
            this.setPort(options.port || 6379);
        }
        this.setPrefix(options.prefix || 'kwevebot:cache');
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
        return new Promise((resolve, reject) => {
            const cacheKey = [this.getPrefix(), key].join(':');
            const client = this.getClient();
            client.set(cacheKey, value, err => {
                if (err) {
                    this.disconnect();
                    return reject(err);
                }
                client.expire(cacheKey, duration);
                this.disconnect();
                resolve(true);
            });
        });
    }
    /**
     * Read Value By key
     *
     * @param {String} key Cache key
     * @returns {Promise<string>}
     */
    read(key) {
        return new Promise((resolve, reject) => {
            const cacheKey = [this.getPrefix(), key].join(':');
            const client = this.getClient();
            client.get(cacheKey, (err, result) => {
                if (err) {
                    this.disconnect();
                    return reject(err);
                }
                this.disconnect();
                resolve(result);
            });
        });
    }
    /**
     * Set Redis Server Hostname
     *
     * @param {String} host
     */
    setHost(host) {
        this.host = host;
    }
    /**
     * Get Redis Server Hostname
     *
     * @returns {String}
     */
    getHost() {
        return this.host;
    }
    /**
     * Set Redis Server Hostport
     *
     * @param {Number} port
     */
    setPort(port) {
        this.port = port;
    }
    /**
     * Get Redis Server Hostport
     *
     * @returns {Number}
     */
    getPort() {
        return this.port;
    }
    /**
     * Set Redis Server Socket Path
     *
     * @param {String} socket
     */
    setSocket(socket) {
        this.socket = socket;
    }
    /**
     * Get Redis Server Socket Path
     *
     * @returns {String}
     */
    getSocket() {
        return this.socket;
    }
    /**
     * Set Redis Cache Prefix
     *
     * @param {String} prefix
     */
    setPrefix(prefix) {
        this.prefix = prefix;
    }
    /**
     * Get Redis Cache Prefix
     *
     * @returns {String}
     */
    getPrefix() {
        return this.prefix;
    }
    /**
     * Set Redis Client Instance
     *
     * @param {RedisClient} client
     */
    setClient(client) {
        this.client = client;
    }
    /**
     * Get Redis Client Instance
     *
     * @returns {RedisClient}
     */
    getClient() {
        if (!this.client) {
            let clientOptions = {
                detect_buffers: true
            };
            if (this.getSocket()) {
                clientOptions.path = this.getSocket();
            } else {
                clientOptions.host = this.getHost();
                clientOptions.port = this.getPort();
            }
            this.setClient(redis.createClient(clientOptions));
        }
        return this.client;
    }
    disconnect() {
        if (this.client) {
            this.client.quit();
            this.client = null;
        }
    }
}
module.exports = RedisCache;
