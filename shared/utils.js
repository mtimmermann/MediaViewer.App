var crypto = require('crypto'),
    logger = require('../shared/logger'),
    //fs = require('fs'),
    fs = require('../vendor/node-fs'),
    util = require('util'), // Node util module
    $ = require('jquery');

exports.randomObjectId = function() {
    return crypto.createHash('md5').update(Math.random().toString()).digest('hex').substring(0, 24);
}

exports.getIntParam = function(param) {
    if (typeof param === 'string' && (/^\d+$/).test(param)) {
        return parseInt(param, 10);
    }
    return null;
}

exports.deleteFiles = function(files) {
    $.each(files, function(index, file) {
        logger.log('info', util.format('Deleting file[%s]', file));
        fs.unlink(file, function(err) {
            if (err) { logError(err); }
        });
    });
}

exports.logError = function(err) {
    logger.log('error', err.message, getAllErrorInfo(err));
}

exports.getAllErrorInfo = function(err) {
    var info = {
        name: err.name,
        message: err.message,
        status: err.status || null,
        stack: err.stack || null,
        //trace: err.trace || '',
        // Local date, logs have a UTC timestamp already
        date: err.date || new Date().toString()
    };

    return info;
}
