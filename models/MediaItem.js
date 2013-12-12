/**
 * MediaItemSchema - mongoose schema model
 *
 * Base schema for media types (e.g. Video, Image)
 */

var mongoose = require('mongoose'),
    extend = require('mongoose-schema-extend'),
    timestamp = require('../shared/models/timestamp');

var MediaItemSchema = new mongoose.Schema({
    ownerId: { type: String, required: true },
    title: String,
    subTitle: String,
    notes: String,
    uri: { type: String, required: true },
    fileId: { type: String, required: true },
    userLabel: { type: String, default: '' },
    isPublic: { type: Boolean, default: true }
}, { collection : 'mediaItems', discriminatorKey : '_type' });

MediaItemSchema.plugin(timestamp);
module.exports = MediaItemSchema;
