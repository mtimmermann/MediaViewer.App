var winston = require('winston'),
    logSettings = require('../config/application.config').logging;

//require('winston-riak').Riak;
require('winston-mongodb').Mongo;

// Log levels
// https://github.com/flatiron/winston/blob/master/lib/winston/config/npm-config.js
// npmConfig.levels = {
//   silly: 0,
//   debug: 1,
//   verbose: 2,
//   info: 3,
//   warn: 4,
//   error: 5
// };


var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console({ level: logSettings.logLevel }),

        //new winston.transports.File({ filename: 'logs/application.log', level: logSettings.logLevel, maxsize: 20000 }),
        new winston.transports.DailyRotateFile({
            filename: logSettings.logFileRolling,
            datePattern: '.yyyy-MM-dd',
            maxsize: 20000,
            maxFiles: 20,
            level: logSettings.logLevel
        }),

        // TODO: Configure "authDb" auth object
        // TODO: Configure "username", "password"
        // https://npmjs.org/package/winston-mongodb
        new winston.transports.MongoDB({
            db: logSettings.db.database,
            port: logSettings.db.port,
            host: logSettings.db.host,
            safe: false, // If true(default), second round trip to db to confirm log entry
            level: logSettings.logLevel
        })

        //new winston.transports.Riak({ bucket: 'logs' })
    ],
    exceptionHandlers: [
        new winston.transports.Console(),
        //new winston.transports.File({ filename: logSettings.logFileExcpetion, maxsize: 20000 }),
        new winston.transports.DailyRotateFile({
            filename: logSettings.logFileExcpetion,
            datePattern: '.yyyy-MM-dd',
            maxsize: 20000,
            maxFiles: 20
        }),
        new winston.transports.MongoDB({
            db: logSettings.db.database,
            collection: 'exceptions',
            port: logSettings.db.port,
            host: logSettings.db.host,
            safe: true // If true(default), second round trip to db to confirm log entry
        })
    ]
});


module.exports = logger;
