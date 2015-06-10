/**
 * Parse incoming string from the device
 * You must return an object with at least: deviceId, command and type
 * where type is something like: ping
 * data looks like:
 * All incomming messages has a command starting with 'B'
 * '(123456789102BR00140607A3332.5862S07037.2134W073.3232411144.5600000000L0001B3CC)'
 */
var actions = require('./actions');

module.exports = function(data) {
    data = data.toString();

    var start = data.indexOf('B');

    if (start > 13) {
        throw 'Device ID is longer than 12 chars!';
    }

    var parts = {
        start: data.substr(0, 1),
        deviceId: data.substring(1, start),
        command: data.substr(start, 4),
        data: data.substring(start + 4, data.length - 1),
        finish: data.substr(data.length - 1, 1)
    };

    parts.action = actions[parts.command] || 'other';
    return parts;
};
