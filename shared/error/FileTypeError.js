/**
 * FileTypeError dependencies
 */

var ApplicationError = require('./ApplicationError');

/**
 * FileTypeError Error constructor.
 *
 * @param {String} msg Error message
 * @inherits ApplicationError
 * @api private
 */

function FileTypeError (msg) {
    ApplicationError.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
    this.name = 'FileTypeError';
};

/**
 * Inherits from ApplicationError.
 */

FileTypeError.prototype.__proto__ = ApplicationError.prototype;

/**
 * exports
 */

module.exports = FileTypeError;