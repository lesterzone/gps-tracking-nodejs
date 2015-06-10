/**
 * Connect to Mongo Database
 * @see  http://mongoosejs.com/docs/connections.html
 */
'use strict';

var mongoose = require('mongoose');
var environment = process.env.NODE_ENV || 'development';
var config = require('../config.json')[environment];

var db = mongoose.connection;
var mongoUrl = 'mongodb://user:pass@host:port/name';

mongoUrl = mongoUrl.replace('user', config.dbUser)
    .replace('pass', config.dbPassword)
    .replace('host', config.dbHost)
    .replace('port', config.dbPort)
    .replace('name', config.dbName);

mongoose.connect(mongoUrl, {
    server: {
        'auto_reconnect': true
    }
});

db.on('error', function(err) {
    console.error('MongoDB connection error:', err);
});

db.once('open', function callback() {
    // console.info('MongoDB connection is established');
});

/**
 * Need more detail on this
 */
db.on('disconnected', function() {
    console.error('MongoDB disconnected!');
    mongoose.connect(process.env.MONGO_URL, {
        server: {
            'auto_reconnect': true
        }
    });
});

db.on('reconnected', function() {
    console.info('MongoDB reconnected!');
});
