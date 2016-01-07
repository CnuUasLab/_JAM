/**
 * Mavlink utils library 
 */

var Mavlink = require('mavlink');

var mavlink = {

	// true when at least one message
	// has been received
	_has_received_message: false,

	incoming: new Mavlink(0, 0),
	outgoing: new Mavlink(250, 1),

	has_received_message: function(arg) {

		if(arg) {
			var previous_state = mavlink._has_received_message;
			mavlink._has_received_message = arg;
			return previous_state;
		}

		return mavlink._has_received_message;

	}
};

module.exports = mavlink;
