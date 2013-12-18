/**
 * ApplicationError constructor
 *
 * Base Error class
 *
 * @param {String} msg Error message
 * @param {Error} err Optional, the inner error
 * @inherits Error https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error
 */

// https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi

function ApplicationError (msg, err) {
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = msg;
    this.name = 'ApplicationError';
    if (err) {
        this.inner = err;
    }
}


/**
 * Inherits from Error.
 */

ApplicationError.prototype.__proto__ = Error.prototype;

/**
 * Module exports.
 */

module.exports = exports = ApplicationError;


/**
 * Expose subclasses
 */

ApplicationError.AuthorizationError = require('./AuthorizationError');
ApplicationError.FileTypeError = require('./FileTypeError');
ApplicationError.FileOperationError = require('./FileOperationError');
