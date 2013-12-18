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
                if (files.length === 0) { deferred.reslove(); }
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

                                    if (files2.length === 0) { deferred.reslove(); }
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
        // Video.find(function(err, docs) {
        //     if (err) { return ControllerErrorHandler.handleError(req, res, err); }
        //     var deferred = $.Deferred();
        //     $.each(docs, function(index, doc) {
        //         User.findById(doc.ownerId, function(err, user) {
        //             if (err) { return ControllerErrorHandler.handleError(req, res, err); }
        //             if (!user) {
        //                 orphans.push(doc);
        //             }
        //             if (index === docs.length -1) {
        //                 deferred.resolve();
        //             }
        //         });
        //     });
        //     $.when(deferred).done(function() {
        //         res.send(JSON.stringify({ totalRecords: orphans.length, data: orphans }));
        //     });
        // });
    });

    app.delete('/file/orphans', ControllerAuth.admin, function(req, res) {
        var orphanFiles = req.body;

        if ($.isArray(orphanFiles)) {
            console.log(orphanFiles);
            $.each(orphanFiles, function(index, file) {

                var deferredOrphanFile = $.Deferred(),
                    deferredUser = $.Deferred(),
                    deferredVideo = $.Deferred();

                //var fileId = file.replace(/(([0-9,A-Z,a-z]){24})(_.*)/, '$1');
                var fileId = file.replace(/(.*\/)(([0-9,A-Z,a-z]){24})(_.*)/, '$2');
                var userId = file.replace(/(.*\/)(([0-9,A-Z,a-z]){24})(\/.*)/, '$2');

                var user = true;
                //var deferredUser = $.Deferred();
                User.findById(userId, function(err, doc) {
                    if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                    if (!doc || (typeof doc === 'object' && $.isEmptyObject(doc))) {
                        console.log('1.user: false');
                        user = false;
                    } else {
                        console.log('1.user: true');
                    }
                    deferredUser.resolve();
                });

                var video = true;
                //var deferredVideo = $.Deferred();
                Video.find({ fileId: fileId }, function(err, doc) {
                    if (err) { return ControllerErrorHandler.handleError(req, res, err); }
                    if (!doc || (typeof doc === 'object' && $.isEmptyObject(doc))) {
                        console.log('1.video: false');
                        video = false;
                    } else {
                        console.log('1.video: true');
                    }
                    // if (video) {
                    //     console.log('1.video: true');
                    // } else {
                    //     console.log('1.video: false');
                    // }
                    deferredVideo.resolve();
                });

                //var userId = 
                $.when.apply(null, [deferredUser, deferredVideo]).done(function() {
                    console.log('fileId: '+ fileId);
                    console.log('userId: '+ userId);
                    console.log('2.user: '+ user);
                    console.log('2.video: '+ video);
                    if (user && video) {
                        console.log('cancel');
                    } else {
                        console.log('delete');
                        AppUtils.deleteFiles(orphanFiles);
                        res.send(JSON.stringify({ totalRecords: orphanFiles.length, data: orphanFiles }));
                    }
                });
            });
        }

        // var deferred = $.Deferred();
        // $.each(orphanIds, function(index, id) {
        //     Video.findById(id, function(err, doc) {
        //         if (err) { return ControllerErrorHandler.handleError(req, res, err); }

        //         AppUtils.deleteFiles([doc.uri, doc.thumbnail]);
        //         Video.findByIdAndRemove(id, function(err, result) {
        //             if (err) { return ControllerErrorHandler.handleError(req, res, err); }
        //             if (index === orphanIds.length -1) {
        //                 deferred.resolve();
        //             }
        //         });
        //     });
        // });
        // $.when(deferred).done(function() {
        //     res.send(JSON.stringify({ totalRecords: orphanIds.length, data: orphanIds }));
        // });
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