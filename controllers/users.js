var User = require('../models/User'),
    ControllerAuth = require('../shared/controller_auth'),
    ControllerErrorHandler = require('../shared/controller_error_handler'),
    ApplicationError = require('../shared/error/ApplicationError'),
    hash = require('../shared/pass').hash,
    logger = require('../shared/logger'),
    util = require('util'), // Node util module
    $ = require('jquery');

module.exports.controllers = function(app) {

    app.get('/user', ControllerAuth.authorize, function(req, res) {
        return User.findById(req.session.user._id, function(err, user) {
            if (err) { return ControllerErrorHandler.handleError(req, res, err); }
            if (!user) {
                // Handling the case where a user has been removed, but the
                //  session still exists in the db.
                err = new ApplicationError.AuthorizationError(util.format(
                    'Cannot find user[%s] in authorized ' +
                    'session', req.session.user._id));
                err.status = 500;
                req.session.destroy();
                return errorHandler(req, res, err);
            }

            var result = user.toObject();
            result.id = user._id;
            delete result._id;
            delete result.salt;
            delete result.hash;
            res.send(JSON.stringify(result));
        });
    });

    app.post('/register', isUserUnique, function (req, res) {
        var password = req.body.password;

        // TODO: Find a better solution. The Mongo User schema does not contain
        //  a password field, temporarily canning a Mongo 'ValidationError'
        if (!password) {
            var validationErrorJson = {"message":"Validation failed","name":"ValidationError","errors":{"password":{"message":"Path `password` is required.","name":"ValidatorError","path":"password","type":"required"}}};
            logger.log('info', validationErrorJson);
            res.statusCode = 400;
            res.send(JSON.stringify({
                code: res.statusCode,
                message: 'Bad Request',
                description: 'Validation Error',
                error: validationErrorJson
            }));
            return;
        }

        // TODO: User model validation, add email regex

        hash(password, function (err, salt, hash) {
            if (err) { return errorHandler(req, res, err); }
            var user = new User({
                email: req.body.email.toLowerCase(),
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                deleted: false,
                salt: salt,
                hash: hash,
            }).save(function (err, newUser) {
                if (err) { return errorHandler(req, res, err); }

                authenticate(newUser.email, password, function(err, user) {
                    if (user) {
                        req.session.regenerate(function() {
                            req.session.user = user;
                            req.session.success = 'Authenticated as ' + user.email;
                            res.send(JSON.stringify({ IsSuccess: true }));
                        });
                    }
                });
            });
        });
    });

    app.post('/login', function (req, res) {
        authenticate(req.body.username, req.body.password, function (err, user) {
            if (err) {
                if (err.message && (err.message === 'User not found' || 
                    err.message === 'Invalid password')) {
                        logger.log('verbose', 'login -> '+ err.message)
                        // Display same 404 message to client, regardless of
                        //  incorrect password or user not found
                        var errorDescription = 'Authentication failed, please '+
                                               'check your username and password.';
                        req.session.error = errorDescription;
                        res.statusCode = 401;
                        res.send(JSON.stringify({
                            code: res.statusCode,
                            message: 'Not Authorized',
                            description: errorDescription
                        }));
                } else {
                    return errorHandler(req, res, err);
                }
            }

            else if (user) {
                req.session.regenerate(function () {
                    req.session.user = user;
                    req.session.success = 'Authenticated as ' + user.email;
                    logger.log('verbose', 'Authenticated as ' + user.email);
                    res.send(JSON.stringify({ IsSuccess: true }));
                });
            }
        });
    });

    app.get('/logout', function (req, res) {
        req.session.destroy(function () {
            res.send(JSON.stringify({ IsSuccess: true }));
        });
    });


    /**
     * Helper methods
     */
    function authenticate(name, pass, fn) {
        if (!module.parent) {
            logger.log('verbose', 'Authenticating %s', name);
        }

        User.findOne({
            email: name.toLowerCase()
        },

        function (err, user) {
            if (user) {
                if (err) return fn(new Error('User not found'));
                hash(pass, user.salt, function (err, hash) {
                    if (err) { return fn(err); }
                    if (hash == user.hash) {
                        return fn(null, user);
                    }
                    return fn(new Error('Invalid password'));
                });
            } else {
                return fn(new Error('User not found'));
            }
        });
    }

    function isUserUnique(req, res, next) {
        User.count({
            email: req.body.email
        }, function (err, count) {
            if (count === 0) {
                next();
            } else {
                var errorDescription = '409 Conflict: User exists';
                req.session.error = errorDescription;
                res.statusCode = 409;
                res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'User exists',
                    description: errorDescription
                }));
            }
        });
    }

}