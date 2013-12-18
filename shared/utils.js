var crypto = require('crypto'),
    logger = require('../shared/logger'),
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
        fs.lstat(file, function(err, stats) {
            if (err) {
                logError(err);
            } else {
                var type = stats.isDirectory() ? 'directory' : 'file'
                logger.log('info', util.format('Deleting %s[%s]', type, file));
                if (!stats.isDirectory()) {
                    fs.unlink(file, function(err) {
                        if (err) { logError(err); }
                    });
                } else {
                    deleteDirectoryRecursive(file);
                }
            }
        });
    });
}

deleteDirectoryRecursive = function(dirPath) {
    var exec = require('child_process').exec,child;
    child = exec('rm -rf '+ dirPath, function(err, out) { 
        if (err) { logError(err); }
    });
}

logError = function(err) {
    logger.log('error', err.message, getAllErrorInfo(err));
}
exports.logError = logError;

getAllErrorInfo = function(err) {
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
exports.getAllErrorInfo = getAllErrorInfo;