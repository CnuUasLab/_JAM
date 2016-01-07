/**
 * Common utilities used throughout
 */

var utils = {

	/**
	 * Custom log function. Handles
	 * repetitive logging and log caching
	 */
	log: function(message) {

		if(!log.lastMessage) {
			log.lastMessage = null;
		}

		if(message == log.lastMessage) {
			return false;
		}

		console.log(message);
		log.lastMessage = message;

		return true;

	}

};

module.exports = utils;
