/**
 * VideoSchema - mongoose schema model
 *
 * Inherits MediaItem schema
 */

var mongoose = require('mongoose'),
    extend = require('mongoose-schema-extend'),
    MediaItem = require('./MediaItem'),
    ModelValidation = require('../shared/models/validation');

var VideoSchema = MediaItem.extend({
    uri: { type: String, required: true },
    thumbnail: { type: String, required: true},
    //origFileName: { type: String, required: true },
    origFileName: String,
    origVideoType: String,
    origExt: String
});

var Video = mongoose.model('video', VideoSchema);
module.exports = Video;
