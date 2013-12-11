var User = require('../models/User'),
    ControllerErrorHandler = require('../shared/controller_error_handler'),
    ApplicationError = require('../shared/error/ApplicationError'),
    $ = require('jquery');

exports.authorize = function(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        sendNotAuthorized(req, res);
    }
}

exports.admin = function(req, res, next) {
    if (req.session.user) {
        User.findById(req.session.user._id, function(err, user) {
            if (err) { return ControllerErrorHandler.handleError(req, res, err); }
            if (!user) {
                // Handling the case where a user has been removed, but the
                //  session still exists in the db.
                err = new ApplicationError.AuthorizationError(util.format(
                    'Cannot find user[%s] in authorized ' +
                    'session', req.session.user._id));
                err.status = 500;
                req.session.destroy();
                return ControllerErrorHandler.handleError(req, res, err);
            }

            if ($.isArray(user.roles) && $.inArray('super-admin', user.roles) >= 0) {
                next();
            } else {
                sendNotAuthorized(req, res);
            }

        });
    } else {
        sendNotAuthorized(req, res);
    }
}

function sendNotAuthorized(req, res) {
    var errorDescription = 'Access denied';
    req.session.error = errorDescription;
    res.statusCode = 403;
    res.send(JSON.stringify({
        code: res.statusCode,
        message: 'Not Authorized',
        description: errorDescription }));
}
