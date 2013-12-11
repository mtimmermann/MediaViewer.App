/**
 * UserSchema - mongoose schema model
 */

var mongoose = require('mongoose'),
	timestamp = require('../shared/models/timestamp'),
    ModelValidation = require('../shared/models/validation');

var UserSchema = new mongoose.Schema({
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    roles: { type: [String], default: [] },
    deleted: Boolean,
    salt: String,
    hash: String
});

// Ensure hash and salt are removed from the returned json result
UserSchema.set('toJSON', { 
    transform: function(doc, ret, options) {
        delete ret.hash;
        delete ret.salt;
        ret.id = ret._id;
        //delete ret._id;
        return ret;
    }
});

UserSchema.path('email').validate(function (email) {
    return ModelValidation.isEmailValid(email);
}, 'Invalid email');

UserSchema.plugin(timestamp);
var User = mongoose.model('users', UserSchema);

module.exports = User;