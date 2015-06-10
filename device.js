/**
 * Device Model
 */
'use strict';

var mongoose = require('mongoose');

/*{
    "_id": "wtwDbvPMtCpNgRST6",
    "phone": "11223344",
    "identifier": "foobar",
    "userId": "N4iRm4S3NgDafsdQT"
}*/

var Device = new mongoose.Schema({
    phone: {
        type: String,
        required: true
    },
    identifier: {
        type: String,
        required: true
    },
    userId: {
        type: String,
    },
    deviceId: {
        type: String
    },

    latitude: {
        type: String
    },

    longitude: {
        type: String
    },

    speed: {
        type: String
    }
}, {
    versionKey: false
});


module.exports = mongoose.model('Device', Device);
