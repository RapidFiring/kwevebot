/// <reference path="../../typings/tsd.d.ts" />
'use strict';

const crypto = require('crypto');
class Cache {
    constructor() {}
    /**
     * Get current Time as UNIX Timestamp
     *
     * @return {Number} Current Timestamp
     */
    getCurrentTime() {
        return Math.floor(new Date().getTime() / 1000);
    }
    getHashedKey(key) {
        return crypto.createHash('sha1').update(key).digest('hex');
    }
}
module.exports = Cache;