/**
 * AuthorizationError dependencies
 */

var ApplicationError = require('./ApplicationError');

/**
 * AuthorizationError Error constructor.
 *
 * @param {String} msg Error message
 * @inherits ApplicationError
 * @api private
 */

function AuthorizationError (msg) {
    ApplicationError.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
    this.name = 'AuthorizationError';
};

/**
 * Inherits from ApplicationError.
 */

AuthorizationError.prototype.__proto__ = ApplicationError.prototype;

/**
 * exports
 */

module.exports = AuthorizationError;