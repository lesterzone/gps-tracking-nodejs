'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var net = require('net');
var extend = require('node.extend');
var functions = require('./functions');
var Device = require('./device');

util.inherits(Device, EventEmitter);
util.inherits(server, EventEmitter);

function server(opts, callback) {
    if (!(this instanceof server)) {
        return new server(opts, callback);
    }

    EventEmitter.call(this);

    var defaults = {
        'debug': false,
        'port': 8000,
        deviceAdapter: false
    };

    //Merge default options with user options
    this.opts = extend(defaults, opts);

    var this_server = this;
    this.devices = [];
    this.db = false;

    this.server = false;
    this.available_adapters = {
        'TK103': './adapters/tk103'
    };

    this.setAdapter = function(adapter) {
        if (typeof(adapter.adapter) != 'function') {
            throw 'adpater() method required to start an instance of it';
        }
        this.deviceAdapter = adapter;
    };

    this.getAdapter = function() {
        return this.deviceAdapter;
    };

    this.addAdaptar = function(model, Obj) {
        this.available_adapters.push(model);
    };

    this.init = function(cb) {

        /**
         * Set debug option
         */
        this_server.setDebug(this.opts.debug);

        /**
         * Device adapter initialization
         */
        if (this_server.opts.deviceAdapter === false) {
            throw 'The app don\'t set the deviceAdapter to use.Which model is sending data to this server ? ';
        }

        if (typeof(this_server.opts.deviceAdapter) === 'string') {

            //Check if the selected model has an available adapter registered
            if (typeof(this.available_adapters[this.opts.deviceAdapter]) === 'undefined') {
                throw 'The class adapter for ' + this.opts.deviceAdapter + ' doesn\'t exists';
            }

            //Get the adapter
            var adapter_file = (this.available_adapters[this.opts.deviceAdapter]);

            this.setAdapter(require(adapter_file));

        } else {
            //IF THE APP PASS THE ADEPTER DIRECTLY
            this_server.setAdapter(this.opts.deviceAdapter);
        }

        this_server.emit('before_init');

        if (typeof(cb) === 'function') {
            cb();
        }

        this_server.emit('init');

        /* FINAL INIT MESSAGE */
        console.log('\n\nGPS LISTENER running at port ' +
            this_server.opts.port + '\nEXPECTING DEVICE MODEL:  ' +
            this_server.getAdapter().model_name +
            '\n\n');
    };

    this.addAdaptar = function(model, Obj) {
        this.adapters.push(model);
    };

    this.log = function(message, from) {

        /**
         * Is debug option disabled?
         */
        if (this.getDebug() === false) {
            return false;
        }

        //If from parameter is not set, default is server.
        if (!from) {
            from = 'SERVER';
        }

        console.log('#' + from + ': ' + message);
    };

    this.setDebug = function(val) {
        this.debug = !!val;
    };

    this.getDebug = function() {
        return this.debug;
    };

    //Init app
    this.init(function() {
        /*************************************
		AFTER INITIALIZING THE APP...
		*************************************/
        this_server.server = net.createServer(function(connection) {
            //Now we are listening!

            //We create an new device and give the an adapter to parse the incomming messages
            connection.device = new Device(this_server.getAdapter(), connection, this_server);
            this_server.devices.push(connection);


            //Once we receive data...
            connection.on('data', function(data) {
                connection.device.emit('data', data);
            });

            // Remove the device from the list when it leaves
            connection.on('end', function() {
                this_server.devices.splice(this_server.devices.indexOf(connection), 1);
                connection.device.emit('disconnected', connection.device.getUID());
            });

            callback(connection.device, connection);

            connection.device.emit('connected');
        }).listen(opts.port);
    });

    /* Search a device by ID */
    this.findDevice = function(device_id) {
        for (var i in this.devices) {
            var dev = this.devices[i].device;
            if (dev.uid === device_id) return dev;
        }
        return false;
    };

    /**
     * Send message to an specific devise
     */
    this.sendTo = function(device_id, msg) {
        var dev = this.findDevice(device_id);
        dev && dev.send(msg);
    };

    return this;
}

exports.server = server;
