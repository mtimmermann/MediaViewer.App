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
    //exec = require('child_process').exec,
    $ = require('jquery');
    //settings = require('../config/application.config').application;

module.exports.controllers = function(app) {


// http://stackoverflow.com/questions/2727167/getting-all-filenames-in-a-directory-with-node-js

    app.get('/file/orphans', ControllerAuth.admin, function(req, res) {
        var orphans = [];

        var dirPath = 'media/';

        if (fs.existsSync(dirPath)) {
            var deferred = $.Deferred();

            fs.readdir(dirPath, function (err, files) {
                if (err) { return ControllerErrorHandler.handleError(req, res, err); }

                //var deferred = $.Deferred();
                if (files.length === 0) { deferred.resolve(orphans); }
                $.each(files, function(index, file) {
                    fs.lstat(dirPath+file, function(err2, stats) {
                        if (err2) { return ControllerErrorHandler.handleError(req, res, err2); }

                        if (stats.isDirectory()) {
                            User.findById(file, function(err3, user) {
                                if (err3) { return ControllerErrorHandler.handleError(req, res, err5); }
                                if (!user) {
                                    orphans.push({ path: dirPath+file, type: 'directory' });
                                    //console.log(dirPath+file);
                                }
                                fs.readdir(dirPath+file, function(err4, files2) {
                                    if (err4) { return ControllerErrorHandler.handleError(req, res, err4); }

                                    if (index === files.length -1 && files2.length === 0) { deferred.resolve(orphans); }
                                    $.each(files2, function(index2, file2) {
                                        fileId = file2.replace(/(([0-9,A-Z,a-z]){24})(_.*)/, '$1');
                                        Video.find({ fileId: fileId }, function(err5, doc) {
                                            if (err5) { return ControllerErrorHandler.handleError(req, res, err5); }
                                            if (!doc || (typeof doc === 'object' && $.isEmptyObject(doc))) {
                                                orphans.push({ path: dirPath+file+'/'+file2, type: 'file' });
                                            }
                                            if (index === files.length -1 && index2 === files2.length -1) {
                                                // Delaying resolve. Without the delay orphan items can be missed.
                                                setTimeout(function() {
                                                    //console.log('deferred.done');
                                                    deferred.resolve(orphans);
                                                }, 500);
                                            }
                                        });
                                        // if (index === files.length -1 && index2 === files2.length -1) {
                                        //     console.log('deferred.done');
                                        //     deferred.resolve(orphans);
                                        // }
                                    });
                                    //deferred.resolve();
                                });
                            });
                        }
                    });
                    // if (index === files.length -1) {
                    //     deferred.resolve();
                    // }
                });
                //$.when(deferred.promise()).done(function() {
                // $.when(deferred.promise()).done(function() {
                //     res.send(JSON.stringify({ totalRecords: orphans.length, data: orphans }));
                // });
            });
            $.when(deferred.promise()).done(function(orphans) {
                res.send(JSON.stringify({ totalRecords: orphans.length, data: orphans }));
            });
        } else {
            res.send(JSON.stringify({ totalRecords: orphans.length, data: orphans }));
        }
    });

    app.delete('/file/orphans', ControllerAuth.admin, function(req, res) {
        var orphanFiles = req.body;

        var fileDeleteList = [];
        var fileSkipList = [];

        if ($.isArray(orphanFiles) && orphanFiles.length > 0) {

            var deferredFiles = $.Deferred();
            $.each(orphanFiles, function(index, file) {

                // Parse the userId & fileId from file name
                var userId = '';
                var userIdRegex = /^media\/([0-9,A-Z,a-z]{24}).*/
                if ((userIdRegex).test(file)) {
                    userId = file.replace(userIdRegex, '$1');
                }
                var fileId = '';
                var fileIdRegex = /.*\/[0-9,A-Z,a-z]{24}\/([0-9,A-Z,a-z]{24})_.*/;
                if ((fileIdRegex).test(file)) {
                    fileId = file.replace(fileIdRegex, '$1');
                }

                // Check if input file path is a directory
                var deferredLstat = $.Deferred();
                fs.lstat(file, function(err, stats) {
                    if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                    deferredLstat.resolve(stats.isDirectory());
                });

                // Check if file is attached to a user db record
                var user = true;
                var deferredUser = $.Deferred();
                User.findById(userId, function(err, doc) {
                    if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                    if (!doc || (typeof doc === 'object' && $.isEmptyObject(doc))) {
                        user = false;
                    }
                    deferredUser.resolve();
                });

                // Check if file is attached to a video db record
                var video = true;
                var deferredVideo = $.Deferred();
                $.when(deferredLstat.promise()).done(function(isDirectory) {
                    if (isDirectory) {
                        video = false;
                        deferredVideo.resolve();
                    } else {
                        Video.find({ fileId: fileId }, function(err, doc) {
                            if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                            if (!doc || (typeof doc === 'object' && $.isEmptyObject(doc))) {
                                video = false;
                            }
                            deferredVideo.resolve();
                        });
                    }
                });

                $.when.apply(null, [deferredUser, deferredVideo]).done(function() {
                    if (user && video) {
                        logger.log('warn', util.format('Skipping deletion of file:"%s" ' +
                            'File is either attached to user:"%s" or video with fileId:"%s" '+
                            ' record', file, userId, fileId));
                        fileSkipList.push(file);
                    } else {
                        // Safe to delete, file not attached to db user or video record
                        fileDeleteList.push(file);
                    }
                });

                if (index === orphanFiles.length -1 ) {
                    // Delaying resolve. Without the delay orphan items can be missed.
                    setTimeout(function() {
                        deferredFiles.resolve(fileDeleteList, fileSkipList);
                    }, 500);
                }
            });

            $.when(deferredFiles.promise()).done(function(deleteList, skipList) {
                //AppUtils.deleteFiles(deleteList);
                //if (skipList.length > 0) { res.statusCode = 409; }
                AppUtils.deleteFiles(deleteList, function(err) {
                    if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                    res.send(JSON.stringify(
                        {
                            totalFilesDeleted: deleteList.length,
                            totalFilesSkiped: skipList.length,
                            data: {
                                deleted: [deleteList],
                                skiped: [skipList]
                            }
                        }
                    ));
                });
            });
        } else {
            res.statusCode = 406;
            res.send(JSON.stringify({
                code: res.statusCode,
                message: 'Not Acceptable',
                description: 'Reqest is missing required body parameters'
            }));
        }
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

}