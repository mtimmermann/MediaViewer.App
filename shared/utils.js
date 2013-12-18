var ApplicationError = require('../shared/error/ApplicationError'),
    crypto = require('crypto'),
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

exports.deleteFiles = function(files, fn) {
    var ERR_FRMT_MSG = 'Failed to delete %s[%s]';

    $.each(files, function(index, file) {
        fs.lstat(file, function(err, stats) {
            if (err) {
                if (fn) { return fn(err); }
            } else {
                var type = stats.isDirectory() ? 'directory' : 'file'
                logger.log('info', util.format('Deleting %s[%s]', type, file));
                if (!stats.isDirectory()) {
                    fs.unlink(file, function(err) {
                        if (err) {
                            // Winston logger does not log inner exception, logging it here
                            logError(err);
                            if (fn) {
                                return fn(new ApplicationError.FileOperationError(
                                    util.format(ERR_FRMT_MSG, type, file)));
                            }
                        }
                    });
                } else {
                    deleteDirectoryRecursive(file, function(err) {
                        if (err) {
                            // Winston logger does not log inner exception, logging it here
                            logError(err);
                            if (fn) {
                                return fn(new ApplicationError.FileOperationError(
                                    util.format(ERR_FRMT_MSG, type, file)));
                            }
                        } 
                    });
                }
            }
        });
    });
    if (fn) { fn(null); }
}

deleteDirectoryRecursive = function(dirPath, fn) {
    var exec = require('child_process').exec,child;
    child = exec('rm -rf '+ dirPath, function(err, out) { 
        if (err) { return fn(err); }
    });
    fn(null);
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