/**
 * Socket / websocket utils library. Handles outgoing and incoming messages
 */

var utils = require('./utils.js');
var socket = require('dgram').createSocket('udp4');
var config = require('./config.js');

var libsock = {

	EVENT_KEY_ON_LIBSOCK_READY: 'ready',
	EVENT_KEY_ON_LIBSOCK_BIND: 'bind',
	EVENT_KEY_ON_LIBSOCK_MESSAGE: 'message',
	EVENT_KEY_ON_LIBSOCK_CLOSE: 'close',
	EVENT_KEY_ON_LIBSOCK_ERROR: 'close',

	socketio_clients: {},
	callbacks: {},

	/**
	 * Bind socket to specified ip address and port
	 *
	 * @emits libsock.EVENT_KEY_ON_LIBSOCK_READY
	 */
	init: function(callback) {

		if(typeof callback != 'function') {
			callback = function() {};
		}

		socket.bind(config.get_config('mavlink').incoming_port, config.get_config('mavlink').incoming_host, function() {
			libsock.emit(libsock.EVENT_KEY_ON_LIBSOCK_BIND, []);
		});

		// once socket is listening on the port
		// call our callback function and continue
		// the program's execution
		socket.on('listening', function() {

			utils.log('libsock>' + config.get_config('mavlink').incoming_port + '> ready.');

			callback.call(socket, config.get_config('mavlink').incoming_host, config.get_config('mavlink').incoming_port);
			libsock.emit(libsock.EVENT_KEY_ON_LIBSOCK_READY, [config.get_config('mavlink').incoming_host, config.get_config('mavlink').incoming_port]);

		});

		socket.on('close', function() {
			utils.log('libsock> Socket connection closed.');
			libsock.emit(libsock.EVENT_KEY_ON_LIBSOCK_CLOSE, []);
		});

		socket.on('error', function(error) {
			utils.log('ERR libsock> ' + error.toString());
			libsock.emit(libsock.EVENT_KEY_ON_LIBSOCK_ERROR, [error]);
		});

		socket.on('message', function(message, rinfo) {
			libsock.emit(libsock.EVENT_KEY_ON_LIBSOCK_MESSAGE, [message, rinfo]);
		});

	},

	/**
	 * Sends data to all connected socket.io clients
	 *
	 * @param bcast_id 	String 	with id of broadcast message
	 * @param data 		Object 	containing data to send to clients
	 */
	io_broadcast: function(bcast_id, data) {

		for(var i in libsock.socketio_clients) {
			libsock.socketio_clients[i].emit(bcast_id, data);
		}

	},

	/**
	 * Wrapper method for socket.send. Sends message to target host
	 *
	 * @param buffer 		Buffer 	to be sent to target host
	 * @param buff_start 	int 	defining buffer index containing beginning of content
	 * @param buff_end 		int 	defining buffer index containing end of content
	 * @param target_port 	Integer containing port of target host
	 * @param target_ip 	String	containing ip address of target host
	 * @param callback 		Function to be called on buffer sent
	 */
	send: function(buffer, buff_start, buff_end, target_port, target_ip, callback) {
		socket.send(buffer, buff_start, buff_end, target_port, target_ip, callback);
	},

	/**
	 * Register new client to be sent application events
	 *
	 * @param client_id 	String 	with hash of client connection
	 * @param client 		Object 	containing client connection data
	 */
	io_register: function(client_id, client) {
		libsock.socketio_clients[client_id] = client;
	},

	/**
	 * Delete client previously signed up to receive socket events
	 *
	 * @param client_id 	String 	with hash of client connection
	 */
	io_unregister: function(client_id) {
		delete libsock.socketio_clients[client_id];
	},

	on: function(evtKey, callback) {

		if(!libsock.callbacks[evtKey]) {
			libsock.callbacks[evtKey] = [];
		}

		libsock.callbacks[evtKey].push(callback);

	},

	emit: function(evtKey, params) {

		if(!libsock.callbacks[evtKey]) {
			return;
		}

		if(!(params instanceof Array)) {
			params = [params];
		}

		for(var i = 0; i < libsock.callbacks[evtKey].length; i++) {
			libsock.callbacks[evtKey][i].apply(libsock, params);
		}

	}

};

module.exports = libsock;