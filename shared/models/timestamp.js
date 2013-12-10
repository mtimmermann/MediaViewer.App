/**
 * Timestamp
 * 
 * mongoose plugin module
 * 
 * Adds created and modified timestamps, updates modified on save.
 */
function timestamp (schema, options) {
    options = options || {};

    // Options
    var fields = {},
        createdPath = options.createdPath || 'created',
        modifiedPath = options.modifiedPath || 'modified';

    // Add paths to schema if not present
    if (!schema.paths[createdPath]) {
        fields[modifiedPath] = { type: Date }
    }
    if (!schema.paths[createdPath]) {
        fields[createdPath] = { 
            type: Date,
            default: Date.now 
        }
    }
    schema.add(fields);

    // Update the modified timestamp on save
    schema.pre('save', function (next) {
        this[modifiedPath] = new Date();
        next();
    });
}

module.exports = timestamp;