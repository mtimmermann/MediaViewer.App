/**
 * Error handler for controllers
 */

var logger = require('../shared/logger'),
    AppUtils = require('../shared/utils');

exports.handleError = function(req, res, err, options) {
    options = options || {};
    var includeErrorDetails = options.includeErrorDetails || true; // Default true

    // Model validation error TYPE_ERROR: 52
    if (err.name && err.name === 'ValidationError') {
        logger.log('info', err);
        res.statusCode = 400;
        res.send(JSON.stringify({
            code: res.statusCode,
            message: 'Bad Request',
            description: 'Validation Error',
            error: err,
            IsSuccess: false
        }));
    }

    // Unhandled error
    else {
        if (includeErrorDetails) {
            logger.log('error', err.message, AppUtils.getAllErrorInfo(err));
        } else {
            logger.log('error', err);
        }
        res.statusCode = 500;
        res.send(JSON.stringify({
            code: res.statusCode,
            message: 'Internal Server Error'
        }));
    }
}

