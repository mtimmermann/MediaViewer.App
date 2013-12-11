var crypto = require('crypto');

exports.randomObjectId = function() {
    return crypto.createHash('md5').update(Math.random().toString()).digest('hex').substring(0, 24);
}

exports.getIntParam = function(param) {
    if (typeof param === 'string' && (/^\d+$/).test(param)) {
        return parseInt(param, 10);
    }
    return null;
}

