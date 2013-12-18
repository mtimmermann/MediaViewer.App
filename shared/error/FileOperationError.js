/**
 * FileOperationError.js dependencies
 */

var ApplicationError = require('./ApplicationError');

/**
 * FileOperationError.js Error constructor.
 *
 * @param {String} msg Error message
 * @param {Error} err Optional, the inner error
 * @inherits ApplicationError
 * @api private
 */

function FileOperationError (msg, err) {
    ApplicationError.call(this, msg, err);
    Error.captureStackTrace(this, arguments.callee);
    this.name = 'FileOperationError';
};

/**
 * Inherits from ApplicationError
 */

FileOperationError.prototype.__proto__ = ApplicationError.prototype;

/**
 * exports
 */

module.exports = FileOperationError;