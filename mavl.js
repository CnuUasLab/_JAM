/**
 * Mavlink utils library 
 */

var Mavlink = require('mavlink');
var config = require('./config.js');

var mavl = {

	// true when at least one message
	// has been received
	_has_received_message: false,
	_is_incoming_ready: false,
	_is_outgoing_ready: false,

	EVENT_KEY_ON_MAVL_READY: 'ready',

	time_boot: null,
	previous_time_boot: null,

	callbacks: {},
	consts: {
		'MAV_CMD_NAV_LAST': 95
	},

	incoming: null,
	outgoing: null,

	/**
	 * Sets the timestamp of the latest message received
	 *
	 * @param timeboot 	Integer	message timestamp
	 */
	set_time_boot: function(timeboot) {
		mavl.previous_time_boot = mavl.time_boot;
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

		if(arg !== null && arg !== undefined) {
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

		if(arg !== null && arg !== undefined) {
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

		if(arg !== null && arg !== undefined) {
			var previous_state = mavl._is_outgoing_ready;
			mavl._is_outgoing_ready = arg;
			return previous_state;
		}

		return mavl._is_outgoing_ready;

	},

	/**
	 * Handles socket message dispatches.
	 *
	 * @param libsock 		Object 	socket library
	 * @param message_type 	String 	type of mavlink message
	 * @param message_body 	Object 	in json format containing message contents
	 * @param target_ip 	String 	containing ip address of target host
	 * @param target_port 	Integer	containing port of target host
	 * @param callback 		Function to be called on message sent
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

	/**
	 * Returns constant integer associated with mavlink command name.
	 * 95 for MAV_CMD_NAV_LAST, and 177 for MAV_CMD_DO_JUMP
	 */
	get_mav_const: function(enum_name, const_name) {

		try {

			console.log('INFO MAV_CONST_NAME', const_name);

			if(!mavl.consts[const_name]) {
				mavl.consts[const_name] = mavl.incoming.enums.filter(function(item) {
					return item.$.name == enum_name;
				})[0].entry.filter(function(item) {
					return item.$.name == const_name;
				})[0].$.value;
				return mavl.consts[const_name];
			}

			return mavl.consts[const_name];

		} catch(e) {
			console.log('EXCEPTION MAV_CONST_NAME', '"' + const_name + '"',
				'is not defined in the mavlink incoming library. \
				Returning hardcoded value.');

			if(const_name == 'MAV_CMD_DO_JUMP') {
				return 177;
			}

			return 95;
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

		for(var i = 0; i < mavl.callbacks[evtKey].length; i++) {
			mavl.callbacks[evtKey][i].apply(mavl, params);
		}

	}

};

module.exports = mavl;
