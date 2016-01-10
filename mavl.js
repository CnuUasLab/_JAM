/**
 * Mavlink utils library 
 */

var Mavlink = require('mavlink');

var mavl = {

	// true when at least one message
	// has been received
	_has_received_message: false,
	_is_incoming_ready: false,
	_is_outgoing_ready: false,

	EVENT_KEY_ON_MAVL_READY = 'ready',

	time_boot: null,
	previous_time_boot: null,

	callbacks: {},

	incoming: null,
	outgoing: null,

	/**
	 * Sets the timestamp of the latest message received
	 *
	 * @param timeboot 	Integer	message timestamp
	 */
	set_time_boot: function(timeboot) {
		mavl.time_boot = timeboot;
	},

	/**
	 * Sets the timestamp of the last message received
	 *
	 * @param timeboot 	Integer	message timestamp
	 */
	set_previous_time_boot: function(timeboot) {
		mavl.previous_time_boot = timeboot;
	},

	/**
	 * Retrieves the timestamp of the latest message received
	 *
	 * @return timestamp of latest message
	 */
	get_time_boot: function() {
		return mavl.time_boot;
	},

	/**
	 * Retrieves the timestamp of the last message received
	 *
	 * @return timestamp of last message received
	 */
	get_previous_time_boot: function() {
		return mavl.previous_time_boot;
	},

	/**
	 * Determines if the mavlink module has received at least one message
	 *
	 * @return boolean true if at least one message has been received
	 * 	from at least one client
	 */
	is_received_message: function(arg) {

		if(arg) {
			var previous_state = mavl._has_received_message;
			mavl._has_received_message = arg;
			return previous_state;
		}

		return mavl._has_received_message;

	},

	/**
	 * Determines if Mavlink library used to parse incoming messages has
	 * finished loading message definitions.
	 *
	 * @return boolean true if 'ready' event has fired by the Mavlink library
	 */
	is_incoming_ready: function(arg) {

		if(arg) {
			var previous_state = mavl._is_incoming_ready;
			mavl._is_incoming_ready = arg;
			return previous_state;
		}

		return mavl._is_incoming_ready;

	},

	/**
	 * Determines if Mavlink library used to send messages back to clients
	 * has finished loading message definitions.
	 *
	 * @return boolean true if 'ready' event has fired by the Mavlink library
	 */
	is_outgoing_ready: function(arg) {

		if(arg) {
			var previous_state = mavl._is_outgoing_ready;
			mavl._is_outgoing_ready = arg;
			return previous_state;
		}

		return mavl._is_outgoing_ready;

	},

	/**
	 * Handles socket message dispatches.
	 *
	 * @param libsock Object 	socket library
	 */
	send_message: function(libsock, message_type, message_body, target_ip, target_port, callback) {

		if(typeof callback != 'function') {
			callback = function() {};
		}

		mavl.outgoing.createMessage(message_type, message_body, function(message) {

			libsock.send(message.buffer, 0, message.buffer.length, target_port, target_ip, function(err, bytes) {

				if(err) {
					callback.call(this, err);
				} else {
					callback.call(this, null);
				}
				
			});
			
		});

	},

	/**
	 * Initialize incoming and outgoing socket connections
	 *
	 * @emits mavl.EVENT_KEY_ON_MAVL_READY
	 */
	init: function(callback) {

		mavl.incoming = new Mavlink(0, 0);
		mavl.outgoing = new Mavlink(250, 1);

		if(typeof callback != 'function') {
			callback = function() {};
		}

		mavl.incoming.on('ready', function() {
			check_mavlink_ready();
		});

		mavl.outgoing.on('ready', function() {
			check_mavlink_ready();
		});

		function check_mavlink_ready() {

			if(!check_mavlink_ready.mavlink_ready_count) {
				check_mavlink_ready.mavlink_ready_count = 0;
			}

			check_mavlink_ready.mavlink_ready_count++;

			if(check_mavlink_ready.mavlink_ready_count >= 2) {
				callback.call(mavl);
				mavl.emit(mavl.EVENT_KEY_ON_MAVL_READY, []);
			}

		}

	},

	on: function(evtKey, callback) {

		if(!mavl.callbacks[evtKey]) {
			mavl.callbacks[evtKey] = [];
		}

		mavl.callbacks[evtKey].push(callback);

	},

	emit: function(evtKey, params) {

		if(!mavl.callbacks[evtKey]) {
			return;
		}

		if(!(params instanceof Array)) {
			params = [params];
		}

		for(var i = 0; i < mavl.callbacks[evtKey].length) {
			mavl.callbacks[evtKey][i].apply(mavl, params);
		}

	},

};

module.exports = mavl;
