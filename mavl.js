/**
 * Mavlink utils library 
 */

var Mavlink = require('mavlink');

var mavlink = {

	// true when at least one message
	// has been received
	_has_received_message: false,

	time_boot: null,
	previous_time_boot: null,

	incoming: new Mavlink(0, 0),
	outgoing: new Mavlink(250, 1),

	set_time_boot: function(timeboot) {
		mavlink.time_boot = timeboot;
	},

	set_previous_time_boot: function(timeboot) {
		mavlink.previous_time_boot = timeboot;
	},

	get_time_boot: function() {
		return mavlink.time_boot;
	},

	get_previous_time_boot: function() {
		return mavlink.previous_time_boot;
	},

	is_received_message: function(arg) {

		if(arg) {
			var previous_state = mavlink._has_received_message;
			mavlink._has_received_message = arg;
			return previous_state;
		}

		return mavlink._has_received_message;

	}
};

module.exports = mavlink;
