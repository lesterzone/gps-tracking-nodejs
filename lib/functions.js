'use strict';

exports.rad = function(x) {
	return x * Math.PI / 180;
};

/**
 * param1 = {lat: X, lng: Y }
 * param2 = {lat: X, lng: Y }
 */
exports.get_distance = function(p1, p2) {
	// Earth’s mean radius in meter
	var R = 6378137;
	var dLat = exports.rad(p2.lat - p1.lat);
	var dLong = exports.rad(p2.lng - p1.lng);
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(exports.rad(p1.lat)) * Math.cos(exports.rad(p2.lat)) *
		Math.sin(dLong / 2) * Math.sin(dLong / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;
	// returns the distance in meter
	return d;
};

exports.send = function(socket, message) {
	socket.write(message);
	console.log('Sending to ' + socket.name + ': ' + message);
};

exports.parse_data = function(data) {
	//Remove 3 type of break lines
	data = data.replace(/(\r\n|\n|\r)/gm, "");

	//al the incomming messages has a cmd starting with 'B'
	var cmd_start = data.indexOf("B");
	if (cmd_start > 13) {
		throw "Device ID is longer than 12 chars!";
	}

	var parts = {
		start: data.substr(0, 1),
		'device_id': data.substring(1, cmd_start),
		cmd: data.substr(cmd_start, 4),
		data: data.substring(cmd_start + 4, data.length - 1),
		finish: data.substr(data.length - 1, 1)
	};
	return parts;
};

exports.parse_gps_data = function(string) {
	return {
		date: string.substr(0, 6),
		availability: string.substr(6, 1),
		latitude: gps_minute_to_decimal(parseFloat(string.substr(7, 9))),
		'latitude_i': string.substr(16, 1),
		longitude: gps_minute_to_decimal(parseFloat(string.substr(17, 9))),
		'longitude_i': string.substr(27, 1),
		speed: string.substr(28, 5),
		time: string.substr(33, 6),
		orientation: string.substr(39, 6),
		'io_state': string.substr(45, 8),
		'mile_post': string.substr(53, 1),
		'mile_data': parseInt(string.substr(54, 8), 16)
	};
};

exports.sendTo = function(socket, cmd, data) {
	if (typeof(socket.device_id) == "undefined") {
		throw "The socket is not paired with a device_id yet";
	}

	var str = gps_format.start;
	str += socket.device_id + gps_format.separator + cmd;
	if (typeof(data) != "undefined") str += gps_format.separator + data;
	str += gps_format.end;
	send(socket, str);
	//Example: (<DEVICE_ID>|<CMD>|<DATA>) - separator: | ,start: (, end: )
};

exports.minuteToDecimal = function(pos, pos_i) {
	if (typeof(pos_i) == "undefined") pos_i = "N";
	var dg = parseInt(pos / 100);
	var minutes = pos - (dg * 100);
	var res = (minutes / 60) + dg;
	return (pos_i.toUpperCase() == "S" || pos_i.toUpperCase() == "W") ? res * -1 : res;
};

// Send a message to all clients
exports.broadcast = function(message, sender) {
	clients.forEach(function(client) {
		if (client === sender) return;
		client.write(message);
	});
	process.stdout.write(message + "\n");
};

exports.data_to_hex_array = function(data) {
	var arr = [];
	for (var i = 0; i < data.length; i++) arr.push(data[i].toString(16));
	return arr;
};

/* RETRUN AN INTEGER FROM A HEX CHAR OR integer */
exports.hex_to_int = function(hex_char) {
	return parseInt(hex_char, 16);
};

exports.sum_hex_array = function(hex_array) {
	var sum = 0;
	for (var i in hex_array) {
		sum += exports.hex_to_int(hex_array[i]);
	}
	return sum;
};

exports.hex_array_to_hex_str = function(hex_array) {
	var str = '';
	for (var i in hex_array) {
		var char;
		if (typeof(hex_array[i]) == "number") {
			char = hex_array[i].toString(16);
		} else {
			char = hex_array[i].toString();
		}

		str += exports.str_pad(char, 2, '0');
	}
	return str;
};

exports.str_pad = function(input, length, string) {
	string = string || '0';
	input = input + '';
	return input.length >= length ? input : new Array(length - input.length + 1).join(string) + input;
};

exports.crc_itu_get_verification = function(hex_data) {
	var crc16 = require('crc-itu').crc16;
	if (typeof(hex_data) == 'String') {
		str = hex_data;
	} else {
		str = exports.hex_array_to_hex_str(hex_data);
	}
	return crc16(str, 'hex');
};