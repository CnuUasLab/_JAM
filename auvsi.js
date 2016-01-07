/**
 * Subscribable Library of utilities for interoperability with auvsi server.
 * Supports subscribing to events for inter-object communication.
 */

var utils = require('./utils.js');

var auvsi = {

	config: {
		host: "10.10.130.10",
		port: 80,
		username: "newport-falcon",
		password: "3813418169"
	},

	connection: {
		
		timeout_attempts: 0,
		timeout_auth_reconnect_delay: 3000,
		timeout_delay: 100,
		timeout: null,

		api_path_server_info: '/api/server_info',
		api_path_login: '/api/login',
		api_path_obstacles: '/api/obstacles',
		api_path_telemetry: '/api/telemetry',

	},

	callbacks: {},

	CONNECTION_MAX_ATTEMPTS = 100,
	RESPONSE_LOGIN_SUCCESS = 'Login Successful.',

	// valid when server info is obtained
	EVENT_KEY_ON_AUVSI_INFO = 'info',
	EVENT_KEY_ON_AUVSI_AUTH = 'auth',
	EVENT_KEY_ON_AUVSI_OBSTACLES = 'obstacles',

	cookie: null,

	/**
	 * Authenticates with auvsi server and retrieves
	 * session cookie
	 *
	 * @emits auvsi.EVENT_KEY_ON_AUVSI_AUTH
	 */
	auth: function(callback) {

		var query = 'username=' + auvsi.config.username + '&password=' + auvsi.config.password;

		var request = http.request({
			method: 'POST',
			path: auvsi.connection.api_path_login,
			host: auvsi.config.host,
			port: auvsi.config.port,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': query.length
			}
		});

		request.on('response', function(response) {

			auvsi.get_response(response, function(data) {

				// if server returns successful connection
				// 	set auth cookie as global variable and
				// 	call interoperability functions
				// else advertise invalid login data
				if(data == auvsi.RESPONSE_LOGIN_SUCCESS) {
					auvsi.cookie = response.headers['set-cookie'][0];
					callback.call(this);
				} else {
					callback.call(this, 'Invalid auvsi auth server response: ' + data);
				}

			});

		});

		request.on('error', function(error) {

			// if auvsi server is down, keep trying
			// to connect every 3 seconds until it's up
			// max number of attempts is 100
			if(error.code == 'ECONNREFUSED') {

				auvsi.connection.timeout_attempts++;

				if(auvsi.connection.timeout_attempts > auvsi.CONNECTION_MAX_ATTEMPTS) {
					return utils.log('ERR auvsi>auth> Maximum number of login attempts exceeded. Unable to establish a connection to auvsi server.');
				}

				utils.log('WARN auvsi>function>auth> Unable to connect to auvsi server. Retrying...');
				
				clearTimeout(auvsi.connection.timeout);
				auvsi.connection.timeout = setTimeout(auvsi.auth, auvsi.connection.timeout_auth_reconnect_delay);
				
			} else {
				utils.log('ERR auvsi>function>auth> ' + error.toString());
			}

		});

		request.end(query);

	},

	/**
	 * Retrieves auvsi obstacle list, server time, message, timestamp
	 * using auvsi server api.
	 *
	 * @param cookie 	String 	http cookie obtained after
	 * 	authenticating with the auvsi server
	 *
	 * @emits auvsi.EVENT_KEY_ON_AUVSI_INFO
	 */
	get_server_info: function(cookie) {

		var request = http.request({

			method: 'GET',
			path: auvsi.connection.api_path_server_info,
			host: auvsi.config.host,
			port: auvsi.config.port,

			headers: {
				'Cookie': cookie
			}

		});

		request.on('response', function(response) {
			auvsi.get_response(response, function(data) {

				if(!data) {
					return utils.log('API ERR /api/server_info ' + data);
				}

				try {
					auvsi.emit(auvsi.EVENT_KEY_ON_AUVSI_INFO, [JSON.parse(data);]);
				} catch(e) {
					utils.log('API ERR /api/server_info -> ' + e);
				}

			});

		});

		request.on('error', function(error) {
			utils.log('ERR auvsi_get_info() failure> ' + error.toString());
		});

		request.end();

	},

	/**
	 * Retrieves auvsi obstacle data using auvsi api.
	 *
	 * @param cookie 	String 	http cookie obtained after
	 * 	authenticating with the auvsi server
	 *
	 * @emits auvsi.EVENT_KEY_ON_AUVSI_OBSTACLES
	 */
	get_obstacles: function(cookie) {

		var request = http.request({

			method: 'GET',
			path: auvsi.api_path_obstacles,
			host: auvsi.config.host,
			port: auvsi.config.port,

			headers: {
				'Cookie': cookie
			}
		});

		request.on('response', function(response) {

			auvsi.get_response(response, function(data) {

				try {
					auvsi.emit(auvsi.EVENT_KEY_ON_AUVSI_OBSTACLES, [JSON.parse(data);]);
				} catch(e) {
					utils.log(e);
				}

			});

		});

		request.on('error', function(error) {
			utils.log('ERR auvsi>function>obstacles> ' + error.toString());
		});

		request.end();

	},

	/**
	 * Posts waypoints received from ground station to auvsi server
	 *
	 * @param telemetry Object 	containing plane telemetry
	 * @param mavlink 	Object 	containint mavlink data / status
	 */
	post_telemetry: function(telemetry, mavlink) {
		
		// holds our loop object
		var query = 'latitude=' + telemetry.get_lat() + '&longitude=' + telemetry.get_lon() + '&altitude_msl=' + telemetry.get_alt_msl() + '&uas_heading=' + telemetry.get_heading();
			
		if(mavlink.is_received_message()) {

			// establish http connection to the auvsi uas server
			var request = http.request({

				method: 'POST',
				path: api_path_telemetry,
				host: auvsi.config.host,
				port: auvsi.config.port,

				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': query.length,
					'Cookie': auvsi.get_cookie()
				}

			});

			request.on('response', function(response) {

				auvsi.get_response(response, function(data) {

					if(data == 'UAS Telemetry Successfully Posted.') {

						if(mavlink.get_previous_time_boot() == mavlink.get_time_boot()) {
							utils.log('No new telemetry received. Posting previously received telemetry...');
						} else {
							utils.log('Successfully posted updated telemetry.');
						}

						mavlink.set_previous_time_boot(mavlink_time_boot);

					} else {
						utils.log('ERR auvsi>function>telemetry> ' + data);
					}

				});

			});

			request.on('error', function(error) {
				utils.log('ERR auvsi>function>telemetry> ' + error.toString());
			});

			request.end(query);

		} else {
			utils.log('WARN auvsi>function>telemetry> Awaiting mavlink telemetry...');
		}

	}

	/**
	 * Initialize auvsi module and auvsi api requests.
	 * Loops ten times per second retrieving api data.
	 */
	init: function() {

		auvsi.auth(function(err) {

			if(err) {
				return utils.log('ERR auvsi>auth> ' + err);
			}

			clearTimeout(auvsi.connection.timeout);
			auvsi.connection.timeout = null;

			auvsi.connection.timeout = setTimeout(function fn() {

				auvsi.get_server_info(auvsi.get_cookie());
				auvsi.get_obstacles(auvsi.get_cookie());

				clearTimeout(auvsi.connection.timeout);
				auvsi.connection.timeout = setTimeout(fn, auvsi.connection.timeout_delay);

			}, auvsi.connection.timeout_delay);

		});

	},

	get_cookie: function() {
		return auvsi.cookie;
	},

	/**
	 * Retrieve response body from an http
	 * response object
	 */
	get_response: function(response, callback) {

		var data = '';

		response.on('data', function(chunk) {
			data += chunk;
		});

		response.on('end', function() {
			callback.call(this, data);
		});

	},

	/**
	 * Subscribe function to event with event_key
	 */
	on: function(event_key, callback) {
		
		if(!auvsi.callbacks[event_key]) {
			auvsi.callbacks[event_key] = [];
		}

		auvsi.callbacks[event_key].push(callback);
	},

	/**
	 * Emit "event" results to any subscribed
	 * callback functions
	 */
	emit: function(event_key, data_array) {

		if(!auvsi.callbacks[event_key]) {
			return;
		}

		if(!(data_array instanceof Array) {
			data_array = [data_array];
		}

		for(var i = 0; i < auvsi.callbacks[event_key].length; i++) {
			auvsi.callbacks[event_key].apply(this, data_array);
		}

	},

	set_config: function(config) {
		auvsi.config = config;
	}

};


module.exports = auvsi;