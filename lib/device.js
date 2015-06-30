'use strict';

var EventEmitter = require('events').EventEmitter;

module.exports = function Device(adapter, connection, GPSServer) {

    EventEmitter.call(this);
    var thisDevice = this;
    this.connection = connection;
    this.server = GPSServer;
    this.adapter = adapter.adapter(this);

    this.uid = false;
    this.ip = connection.ip;
    this.port = connection.port;
    this.name = false;
    this.loged = false;

    init();

    function init() {}

    /**
     * Receiving data from device
     */
    this.on('data', function(data) {
        var chunks = thisDevice.adapter.parse_data(data);

        if (this.getUID() === false && typeof(chunks.deviceId) === 'undefined') {
            throw 'The adapter doesn\'t return the deviceId and is not defined ';
        }

        //something bad happened
        if (chunks === false) {
            thisDevice.log('The message (' + data + ') can\'t be parsed. Discarding');
            return;
        }

        if (typeof(chunks.command) === 'undefined') {
            throw 'The adapter doesn\'t return the command(command) parameter ';
        }

        //If the UID of the devices it hasn't been setted, do it now.
        if (this.getUID() === false) {
            this.setUID(chunks.deviceId);
        }

        thisDevice.makeAction(chunks.action, chunks);
    });

    this.makeAction = function(action, chunks) {
        //If we're not loged
        if (action != 'loginRequest' && !thisDevice.loged) {
            thisDevice.adapter.request_login_to_device();
            console.log(thisDevice.getUID() + ' is trying to ' + action +
                ' but it isn\'t logged. Action wasn\'t executed');
            return false;
        }

        if ('other' === action) {
            return thisDevice.adapter.runOther(chunks.command, chunks);
        }

        /**
         * action = ping|loginRequest|alarm
         */
        thisDevice[action] && thisDevice[action](chunks);
    };

    this.loginRequest = function(chunks) {
        thisDevice.log('I\'m requesting to be loged.');
        thisDevice.emit('loginRequest', this.getUID(), chunks);
    };

    this.loginAuthorized = function(val, chunks) {
        if (val) {
            this.log('Device ' + thisDevice.getUID() + ' has been authorized. Welcome!');
            this.loged = true;
            this.adapter.authorize(chunks);
        } else {
            this.log('Device ' + thisDevice.getUID() + ' not authorized. Login request rejected');
        }
    };

    this.logout = function() {
        this.loged = false;
        this.adapter.logout();
    };

    /**
     * Receiving gps position from device
     */
    this.ping = function(chunks) {
        var gpsData = this.adapter.get_ping_data(chunks);
        if (gpsData === false) {

            /**
             * Something bad happened
             */
            thisDevice.log('GPS Data can\'t be parsed. Discarding packet.');
            return false;
        }

        /**
         * Required:
         *  latitude
         *  longitude
         *  time
         *
         * Optionals
         *  orientation
         *  speed
         *  mileage
         */
        // thisDevice.log('lat: ' + gpsData.latitude + ', long: ' + gpsData.longitude);

        gpsData.inserted = new Date();
        gpsData.fromCommand = chunks.command;
        gpsData.id = this.getUID();
        thisDevice.emit('ping', gpsData);
    };

    /**
     * Receiving alarm
     */
    this.alarm = function(chunks) {

        /**
         * We pass the message parts to the adapter and they have to say wich
         * type of alarm it is.
         */
        var alarm_data = thisDevice.adapter.receiveAlarm(chunks);

        /**
         * Alarm data must return an object like:
         * {
         *    'code': 'sos_alarm',
         *    'msg': 'SOS Alarm activated by the driver'
         * }
         */
        thisDevice.emit('alarm', alarm_data.code, alarm_data, chunks);
    };

    this.setRefreshTime = function(interval, duration) {
        thisDevice.adapter.setRefreshTime(interval, duration);
    };

    /* adding methods to the adapter */
    this.adapter.get_device = function() {
        return device;
    };

    this.send = function(msg) {
        this.emit('send_data', msg);
        this.log('Sending to ' + thisDevice.getUID() + ': ' + msg);
        this.connection.write(msg);
    };

    this.log = function(msg) {
        thisDevice.server.log(msg, thisDevice.getUID());
    };

    this.send_byte_array = function(array) {
        this.emit('send_byte_data', array);
        var buff = new Buffer(array);
        console.log(buff);
        this.log('Sending to ' + thisDevice.uid + ': <Array: [' + array + ']>');
    };

    this.getName = function() {
        return this.name;
    };

    this.setName = function(name) {
        this.name = name;
    };

    this.getUID = function() {
        return this.uid;
    };

    this.setUID = function(uid) {
        this.uid = uid;
    };
};
