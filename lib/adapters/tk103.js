'use strict';

var functions = require('../functions');

var parseData = require('./parseData');
var alarmHandler = require('./alarmHandler');

exports.protocol = 'GPS103';
exports.model_name = 'TK103';
exports.compatible_hardware = ['TK103/supplier'];

var adapter = function(device) {
    if (!(this instanceof adapter)) {
        return new adapter(device);
    }

    this.format = {
        'start': '(',
        'end': ')',
        'separator': ''
    };

    this.device = device;

    /*******************************************
    PARSE THE INCOMING STRING FROM THE DECIVE
    You must return an object with a least: device_id, cmd and type.
    return device_id: The device_id
    return cmd: command from the device.
    return type: loginRequest, ping, etc.
    *******************************************/
    this.parse_data = parseData;
    this.receiveAlarm = alarmHandler;

    this.authorize = function() {
        this.sendCommand('AP05');
    };

    this.runOther = function(cmd, chunks) {
        switch (cmd) {

            //Handshake
            case 'BP00':
                this.device.send(this.formatData(this.device.uid + 'AP01HSO'));
                break;
        }
    };

    this.request_login_to_device = function() {
        console.trace('called request_login_to_device');
    };

    this.get_ping_data = function(chuncks) {
        var str = chuncks.data;

        var data = {
            date: str.substr(0, 6),
            availability: str.substr(6, 1),
            latitude: functions.minuteToDecimal(parseFloat(str.substr(7, 9)), str.substr(16, 1)),
            longitude: functions.minuteToDecimal(parseFloat(str.substr(17, 9)), str.substr(27, 1)),
            speed: parseFloat(str.substr(28, 5)),
            time: str.substr(33, 6),
            orientation: str.substr(39, 6),
            // 'io_state': str.substr(45, 8),
            // 'mile_post': str.substr(53, 1),
            mileData: parseInt(str.substr(54, 8), 16)
        };


        var datetime = '20' + data.date.substr(0, 2) + '/' + data.date.substr(2, 2) + '/' + data.date.substr(4, 2);
        datetime += ' ' + data.time.substr(0, 2) + ':' +
            data.time.substr(2, 2) + ':' + data.time.substr(4, 2);

        data.datetime = new Date(datetime);

        var response = {
            latitude: data.latitude,
            longitude: data.longitude,
            time: new Date(data.date + ' ' + data.time),
            speed: data.speed,
            orientation: data.orientation,
            mileage: data.mileData
        };

        return response;
    };

    /* SET REFRESH TIME */
    this.set_refresh_time = function(interval, duration) {
        //XXXXYYZZ
        //XXXX Hex interval for each message in seconds
        //YYZZ Total time for feedback
        //YY Hex hours
        //ZZ Hex minutes
        var hours = parseInt(duration / 3600);
        var minutes = parseInt((duration - hours * 3600) / 60);
        var time = f.str_pad(interval.toString(16), 4, '0') +
            f.str_pad(hours.toString(16), 2, '0') +
            f.str_pad(minutes.toString(16), 2, '0');

        this.sendCommand('AR00', time);
    };

    /**
     * Internal functions
     */
    this.sendCommand = function(command, data) {
        var message = [this.device.uid, command, data];
        this.device.send(this.formatData(message));
    };

    this.formatData = function(params) {
        var str = this.format.start;

        if (typeof(params) === 'string') {
            str += params;
        } else if (params instanceof Array) {
            str += params.join(this.format.separator);
        } else {
            throw 'The parameters to send to the device must be string|array';
        }
        str += this.format.end;
        return str;
    };
};

exports.adapter = adapter;
