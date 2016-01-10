/**
 * Configuration library. Handles config file parsing.
 * Settings for this application should not be set here,
 * please use 'config.json' for that.
 */

var fs = require('fs');

var config = {

	DEFAULT_CONFIG_FILE: './config.json',

	settings: {

		application: {},
		auvsi: {},
		mavlink: {},
		grid: {}

	},

	parse_file: function(fpath, callback) {

		fs.readFile(fpath, function(err, data) {

			if(err) {
				return callback.call(config, err.toString());
			}

			try {

				var contents = JSON.parse(data);

				for(var i in contents.application) {
					config.settings.application[i] = contents.application[i];
				}

				for(var i in contents.auvsi) {
					config.settings.auvsi[i] = contents.auvsi[i];
				}

				for(var i in contents.mavlink) {
					config.settings.mavlink[i] = contents.mavlink[i];
				}

				for(var i in contents.grid) {
					config.settings.grid[i] = contents.grid[i];
				}

				callback.call(config, null, config.settings);

			} catch(err) {
				callback.call(config, err.toString());
			}

		});

	},

	init: function(callback) {

		if(typeof callback != 'function') {
			callback = function() {};
		}

		config.parse_file(config.DEFAULT_CONFIG_FILE, callback);

	},

	get_config: function(setting_id) {
		return config.settings[setting_id];
	}

};

module.exports = config;