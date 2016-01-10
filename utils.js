/**
 * Common utilities used throughout
 */

var utils = {

	log_last_message: null,

	/**
	 * Custom log function. Handles
	 * repetitive logging and log caching
	 */
	log: function(message) {

		if(message == utils.log_last_message) {
			return false;
		}

		console.log(message);
		utils.log_last_message = message;

		return true;

	}

};

module.exports = utils;
