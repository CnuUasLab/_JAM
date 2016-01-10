/**
 * Configuration library. Handles config file parsing.
 * Application must be restarted for changes to take place
 */

var fs = require('fs');

/**
 * Change application settings using this object
 * changes will be reflected across all modules
 */
var settings = {

	"application": {
		"in_production": false
	},
	"auvsi": {
		"host": "10.10.130.10",
		"port": 80,
		"username": "newport-falcon",
		"password": "3813418169"
	},

	"mavlink": {
		"incoming_host": "0.0.0.0",
		"incoming_port": 14551,
		"outgoing_host": "home.nigelarmstrong.me",
		"outgoing_port": 14552
	},

	"grid": {
		"grid_width": 100,
		"grid_padding_height": 10
	}

};

/**
 * If changing a setting, please do not alter object below
 * it is only there to expose a config manager api
 */

var config = {

	DEFAULT_CONFIG_FILE: './config.json',

	set_setting: function(key, value) {
		settings[key] = value;
	},

	/**
	 * Replaces entire config object with new one
	 */
	set_config: function(new_conf) {
		settings = new_conf;
	},

	/**
	 * Retrieves entire config object, or
	 * a specific property
	 */
	get_config: function(setting_id) {

		if(setting_id) {
			return settings[setting_id];
		}

		return settings;
	}

};

module.exports = config;