'use strict';

var gps = require('./index');
// require('./config/database');
// var Device = require('./device');
// var net = require('net');

var options = {
    debug: true,
    port: 8000,
    deviceAdapter: 'TK103'
};

gps.server(options, function(device, connection) {
    console.log('connection, ', connection);
    device.on('loginRequest', function(deviceId, chunks) {
        console.log('on loginRequest', deviceId);
        // Device.findOne({
        //     deviceId: deviceId
        // }, function(err, data) {
        //     if (err) {
        //         return console.log(err);
        //     }

        //     if (!data) {

        //         var newDevice = new Device({
        //             deviceId: deviceId,
        //             identifier: 'foobar',
        //             phone: '33445566',
        //             userId: 'N4iRm4S3NgDafsdQT'
        //         });

        //         newDevice.save(function(err, saved) {
        //             console.log(err, !!saved);
        //         });
        //     }
        // });

        // Do some stuff before authenticate the device...*Some devices sends a login request before transmitting their position * Accept the login request.You can set false to reject the device.

        this.loginAuthorized(true);
    });

    /**
     * PING -> When the gps sends their position
     */
    device.on('ping', function(data) {
        return console.log('on ping', data.id);
        // Device.update({
        //     deviceId: data.id
        // }, {
        //     $set: {
        //         latitude: data.latitude,
        //         longitude: data.longitude,
        //         speed: data.speed
        //     }
        // }, function(err, updated) {
        //     console.log(err || 'updated ' + data.id);
        // });
        // return data;
    });

    device.on('alarm', function(data) {
        console.log('alarm data', data);
    });

    device.on('send_data', function(message) {
        console.log('message', message);
    });

    device.on('disconnected', function(deviceConnection) {
        var id = deviceConnection.device.getUID();
        console.log('on device disconnected', id);
        deviceConnection.destroy();
    });
});
