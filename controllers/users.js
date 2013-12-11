var User = require('../models/User'),
    ControllerAuth = require('../shared/controller_auth'),
    ControllerErrorHandler = require('../shared/controller_error_handler'),
    AppUtils = require('../shared/utils'),
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
                return ControllerErrorHandler.handleError(req, res, err);
            }
            res.send(JSON.stringify(user));
        });
    });

    app.get('/users', ControllerAuth.admin, function(req, res) {

        var page = AppUtils.getIntParam(req.query.page);
        var pageSize = AppUtils.getIntParam(req.query.pageSize)
        var search = req.query.search;

        if (search) {
            User.find(
                {
                    //ownerId: req.session.user._id,
                    '$or':[
                        {'lastName':{'$regex':search, '$options':'i'}},
                        {'firstName':{'$regex':search, '$options':'i'}}]
                },
                function(err, docs) {
                    if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                    res.send(JSON.stringify({ data: docs }));
            });
        } else {

            getCount({}, function(err1, count) {
                if (err1) { return ControllerErrorHandler.handleError(req, res, err1); }

                if (page && pageSize) {
                    var top = (page -1) * pageSize;
                    var start = top - pageSize;
                    if (start < count) {

                        // TODO: Determine how to ingore case with sort
                        //return User.find({ ownerId: req.session.user._id }).sort(sortObj).skip((page-1) * pageSize).limit(pageSize).exec(function(err, docs) {
                        return User.find({}).sort(sortObj).skip((page-1) * pageSize).limit(pageSize).exec(function(err, docs) {
                            if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                            res.send(JSON.stringify({ totalRecords: count, page: page, data: docs }));
                        });
                    }
                    res.send(JSON.stringify({ totalRecords: count, page: page, data: [] }));
                } else {
                    var sortBy = req.query.sort_by ? req.query.sort_by : 'lastName';
                    var argOrder = req.query.order ? req.query.order : 'asc';
                    var sortOrder = argOrder === 'desc' ? -1 : 1;
                    var sortObj = {};
                    sortObj[sortBy] = sortOrder;

                    return User.find({}).sort(sortObj).exec(function(err, docs) {
                        if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                        res.send(JSON.stringify({ totalRecords: count, data: docs }));
                    });
                }
            });
        }
    });

    app.get('/users/:id', ControllerAuth.admin, function(req, res) {

        User.findById(req.params.id, function(err, doc) {
            if (err) { return ControllerErrorHandler.handleError(req, res, err); }
            if (doc) {
                // var result = doc.toObject();
                // result.id = doc._id;
                // delete result._id;
                // res.send(JSON.stringify(result));
                res.send(JSON.stringify(doc));
            } else {
                res.statusCode = 404;
                return res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'Error 404: user not found'}));
            }
        });
    });

    app.put('/users/:id', ControllerAuth.admin, function(req, res) {

        var jsonModel = req.body;

        // If password change is requested, update the salt and hash
        var deferred = $.Deferred();
        if (req.body.password) {
            logger.log('info', util.format('Admin[userId:%s] password change operation for user[%s]', req.session.user._id, jsonModel.id));
            hash(req.body.password, function (err, salt, hash) {
                jsonModel = $.extend(jsonModel, { salt: salt, hash: hash });
                deferred.resolve();
            });
        } else {
            deferred.resolve();
        }

        $.when(deferred).done(function() {
            User.findById(req.params.id, function(err, user) {
                if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                if (!user) {
                    res.statusCode = 404;
                    res.send(JSON.stringify({
                        code: res.statusCode,
                        message: 'Error 404: user not found'
                    }));
                }
                // Using Schema.save, not Schema.findByIdAndUpdate as only save
                //  executes Schema.pre('save')
                // Mongoose issue: pre, post middleware are not executed on findByIdAndUpdate
                // https://github.com/LearnBoost/mongoose/issues/964
                //User.findByIdAndUpdate(req.params.id, jsonModel, { new: true }, function(err, doc) {
                user = $.extend(user, jsonModel);
                user.save(function(err, doc) {
                    if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                    res.send(JSON.stringify(doc));
                });
            });
        });
    });

    // app.post('/users', ControllerAuth.admin, function(req, res) {
    //     var jsonModel = req.body;
    //     delete jsonModel.id;

    //     var user = new User(jsonModel).save(function (err, doc) {
    //         if (err) { return ControllerErrorHandler.handleError(req, res, err); }
    //         res.send(JSON.stringify(doc));
    //     });
    // });

    app.delete('/users/:id', ControllerAuth.admin, function(req, res) {

        User.findById(req.params.id, function(err, doc) {
            if (err) { return ControllerErrorHandler.handleError(req, res, err); }
            if (!doc) {
                res.statusCode = 404;
                res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'Error 404: user not found'
                }));
            }
            User.findByIdAndRemove(req.params.id, function(err, result) {
                if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                res.send(JSON.stringify({ IsSuccess: true }));
            });
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

    function getCount(options, fn) {
        options = options || {};
        User.count(options, function(err, count) {
            if (err) return fn(err, null);
            fn(null, count);
        });
    }
}