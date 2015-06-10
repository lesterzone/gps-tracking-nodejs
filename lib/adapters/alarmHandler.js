'use strict';

var options = require('./alarmOptions');

module.exports = function(chunks) {

    //Maybe we can save the gps data too.
    //gps_data = chunks.data.substr(1);
    var code = chunks.data.substr(0, 1);
    var alarm = options[code.toString()] || false;
    this.sendCommand('AS01', code.toString());
    return alarm;
}
