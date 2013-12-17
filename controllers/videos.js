var Video = require('../models/Video'),
    User = require('../models/User'),
    ControllerAuth = require('../shared/controller_auth'),
    ControllerErrorHandler = require('../shared/controller_error_handler'),
    AppUtils = require('../shared/utils'),
    ApplicationError = require('../shared/error/ApplicationError'),
    logger = require('../shared/logger'),
    //fs = require('fs'),
    fs = require('../vendor/node-fs'),
    pathUtil = require('path'), // Node path module
    util = require('util'), // Node util module
    exec = require('child_process').exec,
    $ = require('jquery'),
    settings = require('../config/application.config').application;

module.exports.controllers = function(app) {

    app.get('/videos', function(req, res) {

        var page = AppUtils.getIntParam(req.query.page);
        var pageSize = AppUtils.getIntParam(req.query.pageSize)
        var search = req.query.search;

        if (search) {
            Video.find(
                {
                    ownerId: req.session.user._id,
                    '$or':[
                        {'title':{'$regex':search, '$options':'i'}},
                        {'subtitle':{'$regex':search, '$options':'i'}}]
                },
                function(err, docs) {
                    if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                    res.send(JSON.stringify({ data: docs }));
            });
        } else {
            //getCountFunctionDefered(req.session.user._id, function(err1, count) {
            getCount({}, function(err1, count) {
                if (err1) { return ControllerErrorHandler.handleError(req, res, err1); }

                //var sortBy = req.query.sort_by ? req.query.sort_by : 'lastName';
                var sortBy = req.query.sort_by ? req.query.sort_by : 'created';
                var argOrder = req.query.order ? req.query.order : 'asc';
                var sortOrder = argOrder === 'desc' ? -1 : 1;
                var sortObj = {};
                sortObj[sortBy] = sortOrder;

                if (page && pageSize) {
                    var top = (page -1) * pageSize;
                    var start = top - pageSize;
                    if (start < count) {

                        // Note, the following sytax is used w/ Mongojs
                        // TODO: Determine how to ingore case with sort
                        // return db.contacts.find().sort(sortObj).skip((page-1) * pageSize).limit(pageSize, function(err, docs) {
                        //     res.send(JSON.stringify({ totalRecords: count, page: page, data: docs }));
                        // });

                        // TODO: Determine how to ingore case with sort
                        //return Video.find({ ownerId: req.session.user._id }).sort(sortObj).skip((page-1) * pageSize).limit(pageSize).exec(function(err, docs) {
                        return Video.find({ }).sort(sortObj).skip((page-1) * pageSize).limit(pageSize).exec(function(err, docs) {
                            if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                            res.send(JSON.stringify({ totalRecords: count, page: page, data: docs }));
                        });
                    }
                    res.send(JSON.stringify({ totalRecords: count, page: page, data: [] }));
                } else {
                    //return Video.find({ ownerId: req.session.user._id }).sort(sortObj).exec(function(err, docs) {
                    return Video.find({}).sort(sortObj).exec(function(err, docs) {
                        if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                        res.send(JSON.stringify({ totalRecords: count, data: docs }));
                    });
                }
            });
        }
    });

    //app.get('/videos/:id', ControllerAuth.authorize, function(req, res) {
    app.get('/videos/:id', function(req, res) {

        Video.findById(req.params.id, function(err, doc) {
            if (err) { return ControllerErrorHandler.handleError(req, res, err); }
            if (doc) {
                //if (doc.ownerId === req.session.user._id) {
                var result = doc.toObject();
                result.id = doc._id;
                delete result._id;
                res.send(JSON.stringify(result));
            } else {
                res.statusCode = 404;
                return res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'Error 404: contact not found'}));
            }
        });
    });

    app.put('/videos/:id', ControllerAuth.authorize, function(req, res) {

        var videoObj = req.body;
        delete videoObj.id;

        User.findById(req.session.user._id, function(err, user) {
            if (err) { AppUtils.logError(err); }
            if (user) {
                videoObj.userLabel = util.format('%s %s', user.firstName, user.lastName);
            }

            Video.findById(req.params.id, function(err, video) {
                if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                if (!video) {
                    res.statusCode = 404;
                    res.send(JSON.stringify({
                        code: res.statusCode,
                        message: 'Error 404: video not found'
                    }));
                }
                if (video.ownerId === req.session.user._id) {
                    // Using Schema.save, not Schema.findByIdAndUpdate as only save
                    //  executes Schema.pre('save')
                    // Mongoose issue: pre, post middleware are not executed on findByIdAndUpdate
                    // https://github.com/LearnBoost/mongoose/issues/964
                    //Video.findByIdAndUpdate(req.params.id, videoObj, { new: true }, function(err, doc) {
                    video = $.extend(video, videoObj);
                    video.save(function(err, doc) {
                        if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                        var result = doc.toObject();
                        result.id = doc._id;
                        delete result._id;
                        res.send(JSON.stringify(result));
                    });
                } else {
                    // User does not own video, not authorized
                    res.statusCode = 403;
                    res.send(JSON.stringify({
                        code: res.statusCode,
                        message: 'Not Authorized'
                    }));
                }
            });
        });
    });

    app.post('/videos', ControllerAuth.authorize, function(req, res) {
        var jsonModel = req.body;
        delete jsonModel.id;
        jsonModel.ownerId = req.session.user._id;

        User.findById(req.session.user._id, function(err, user) {
            if (err) { AppUtils.logError(err); }
            if (user) {
                jsonModel.userLabel = util.format('%s %s', user.firstName, user.lastName);
            }

            var video = Video(jsonModel).save(function (err, doc) {
                if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                var result = doc.toObject();
                result.id = doc._id;
                delete result._id;
                res.send(JSON.stringify(result));
            });
        });
    });

    app.delete('/videos/:id', ControllerAuth.authorize, function(req, res) {

        Video.findById(req.params.id, function(err, doc) {
            if (err) { return ControllerErrorHandler.handleError(req, res, err); }

            if (!doc) {
                res.statusCode = 404;
                res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'Error 404: video not found'
                }));
            }
            if (doc.ownerId === req.session.user._id) {
                AppUtils.deleteFiles([doc.uri, doc.thumbnail]);
                Video.findByIdAndRemove(req.params.id, function(err, result) {
                    if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                    res.send(JSON.stringify({ IsSuccess: true }));
                });
            } else {
                // User does not own video, not authorized
                res.statusCode = 403;
                res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'Not Authorized'
                }));
            }
        });
    });

    app.post('/videos/upload', ControllerAuth.authorize, function(req, res) {

        var fileName = req.files.file.name; 

        // ffmpeg thumbnails
        // https://trac.ffmpeg.org/wiki/Create%20a%20thumbnail%20image%20every%20X%20seconds%20of%20the%20video

        // TODO: Determine file type info with ffmpeg || ffprobe, don't trust the extension.
        // req.files.file.type
        var ext = pathUtil.extname(fileName).toLowerCase();
        if ($.inArray(ext, ['.ogg', '.ogv', '.webm', '.mp4', '.mov', '.m4v', '.mkv']) >= 0) {
            var dirPath = 'media/'+ req.session.user._id +'/';

            if (!fs.existsSync(dirPath)) {
                //fs.mkdirSync(dirPath, 0644, true);
                fs.mkdirSync(dirPath, 0755, true);
            }

            var fileId = AppUtils.randomObjectId();
            fileName = fileId +'_'+ fileName;

            logger.log('info', util.format('Saving video file[%s]', dirPath + fileName));
            require('fs').rename(req.files.file.path, dirPath + fileName, function(err) {
                if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                getMetaData(dirPath + fileName, function(err, metaData) {
                    if (err) {
                        AppUtils.deleteFiles([dirPath + fileName]);
                        return ControllerErrorHandler.handleError(req, res, err);
                    }
                    var duration = 0.0;
                    if (metaData.format && metaData.format.duration) {
                        duration = parseFloat(metaData.format.duration);
                    }

                    createThumbnail(dirPath+fileName, duration, function(err2, imageFile) {
                        if (err2) {
                            AppUtils.deleteFiles([dirPath + fileName]);
                            return ControllerErrorHandler.handleError(req, res, err2);
                        }
                        res.json({
                            IsSuccess: true,
                            uri: dirPath + fileName,
                            thumbnail: imageFile,
                            fileId: fileId
                        });
                    });
                });
            });

        } else {
            // TODO: Convert to flv via ffmpeg
            // var dirPath = 'media/stage/'+ req.session.user._id +'/';
            // if (!fs.existsSync(dirPath)) {
            //     //fs.mkdirSync(dirPath, 0644, true);
            //     fs.mkdirSync(dirPath, 0755, true);
            // }

            var err = new ApplicationError.FileTypeError(util.format(
                'Cannot process file[%s], expecting file types: ' +
                '.ogg, .webm, .mov .m4v', req.files.file.name));
            err.status = 500;
            return ControllerErrorHandler.handleError(req, res, err);
        }
    });

    app.get('/video/orphans', ControllerAuth.admin, function(req, res) {
        var orphans = [];
        Video.find(function(err, docs) {
            if (err) { return ControllerErrorHandler.handleError(req, res, err); }
            var deferred = $.Deferred();
            $.each(docs, function(index, doc) {
                User.findById(doc.ownerId, function(err, user) {
                    if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                    if (!user) {
                        orphans.push(doc);
                    }
                    if (index === docs.length -1) {
                        deferred.resolve();
                    }
                });
            });
            $.when(deferred).done(function() {
                res.send(JSON.stringify({ totalRecords: orphans.length, data: orphans }));
            });
        });
    });

    app.delete('/video/orphans', ControllerAuth.admin, function(req, res) {
        var orphanIds = req.body;

        var deferred = $.Deferred();
        $.each(orphanIds, function(index, id) {
            Video.findById(id, function(err, doc) {
                if (err) { return ControllerErrorHandler.handleError(req, res, err); }

                AppUtils.deleteFiles([doc.uri, doc.thumbnail]);
                Video.findByIdAndRemove(id, function(err, result) {
                    if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                    if (index === orphanIds.length -1) {
                        // Delaying resolve. Without the delay orphan items can be missed.
                        setTimeout(function() {
                            deferred.resolve(orphanIds);
                        },500);
                    }
                });
            });
        });
        $.when(deferred.promise).done(function(orphanIds) {
            res.send(JSON.stringify({ totalRecords: orphanIds.length, data: orphanIds }));
        });
    });

    /**
     * Helper methods
     */
    function getCount(options, fn) {
        options = options || {};
        //Video.count({ ownerId: userId }, function(err, count) {
        Video.count(options, function(err, count) {
            if (err) return fn(err, null);
            fn(null, count);
        });
    }

    function createThumbnail(videoFile, duration, fn) {
        var ext = pathUtil.extname(videoFile);
        var baseName = pathUtil.basename(videoFile, ext);
        var imgFile = pathUtil.dirname(videoFile) +'/'+ baseName +'.png';

        var ffmpeg = settings.x64 ? 'ffmpeg ' : 'ffmpeg_32 ';
        var secSnapshot = duration > 10.0 ? '00:00:10.00' : '00:00:01.00';

        var args = util.format('-i %s -ss %s -f image2 -vframes 1 %s', videoFile, secSnapshot, imgFile);
        var child = exec('./ffmpeg/'+ ffmpeg + args, // command line argument directly in string
            function (error, stdout, stderr) {      // one easy function to capture data/errors
            if (error) return fn(error, null);
            fn(null, imgFile);
        });
    }

    function getMetaData(videoFile, fn) {

        var ffprobe = settings.x64 ? 'ffprobe ' : 'ffprobe_32 ';
        // http://stackoverflow.com/questions/7708373/get-ffmpeg-information-in-friendly-way
        var args = util.format('-v quiet -print_format json -show_format -show_streams  %s', videoFile);
        var child = exec('./ffmpeg/'+ ffprobe + args, // command line argument directly in string
            function (error, stdout, stderr) {      // one easy function to capture data/errors
            if (error) return fn(error, null);
            var meta = null;
            try {
                meta = $.parseJSON(stdout);
                return fn(null, meta);
            } catch (e) { throw e; }
        });
    }

}