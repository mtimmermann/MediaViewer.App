var crypto = require('crypto');

var Utils = {};

Utils.randomObjectId = function() {
    return crypto.createHash('md5').update(Math.random().toString()).digest('hex').substring(0, 24);
}

module.exports = Utils;
