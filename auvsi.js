/**
 * Subscribable Library of utilities for interoperability with auvsi server.
 * Supports subscribing to events for inter-object communication.
 */

var http = require('http');

var utils = require('./utils.js');
var config = require('./config.js');

var auvsi = {

	connection: {
		
		timeout_attempts: 0,
		timeout_auth_reconnect_delay: 3000,
		timeout_delay: 100,
		timeout: null,

		api_path_server_info: '/api/server_info',
		api_path_login: '/api/login',
		api_path_obstacles: '/api/obstacles',
		api_path_telemetry: '/api/telemetry',
		api_path_targets: '/api/targets'

	},

	callbacks: {},

	CONNECTION_MAX_ATTEMPTS: 100,
	RESPONSE_LOGIN_SUCCESS: 'Login Successful.',

	// valid when server info is obtained
	EVENT_KEY_ON_AUVSI_INFO: 'info',
	EVENT_KEY_ON_AUVSI_AUTH: 'auth',
	EVENT_KEY_ON_AUVSI_OBSTACLES: 'obstacles',

	cookie: null,

	/**
	 * Authenticates with auvsi server and retrieves
	 * session cookie
	 *
	 * @emits auvsi.EVENT_KEY_ON_AUVSI_AUTH
	 */
	auth: function(callback) {

		var query = 'username=' + config.get_config('auvsi').username + '&password=' + config.get_config('auvsi').password;

		var request = http.request({
			method: 'POST',
			path: auvsi.connection.api_path_login,
			host: config.get_config('auvsi').host,
			port: config.get_config('auvsi').port,
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
					return utils.log('ERR AUVSI AUTH Maximum number of login attempts exceeded. Unable to establish a connection to auvsi server.');
				}

				utils.log('WARN AUVSI AUTH Unable to connect to auvsi server. Retrying...');
				
				clearTimeout(auvsi.connection.timeout);
				auvsi.connection.timeout = setTimeout(auvsi.auth, auvsi.connection.timeout_auth_reconnect_delay);
				
			} else {
				utils.log('ERR AUVSI AUTH ' + error.toString());
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
			host: config.get_config('auvsi').host,
			port: config.get_config('auvsi').port,

			headers: {
				'Cookie': cookie
			}

		});

		request.on('response', function(response) {
			auvsi.get_response(response, function(data) {

				if(!data) {
					return utils.log('ERR AUVSI URL(/api/server_info) ' + data);
				}

				try {
					auvsi.emit(auvsi.EVENT_KEY_ON_AUVSI_INFO, [JSON.parse(data)]);
				} catch(e) {
					utils.log('ERR AUVSI URL(/api/server_info)  ' + e);
				}

			});

		});

		request.on('error', function(error) {
			utils.log('ERR AUVSI FUNC(auvsi_get_info) ' + error.toString());
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
			path: auvsi.connection.api_path_obstacles,
			host: config.get_config('auvsi').host,
			port: config.get_config('auvsi').port,

			headers: {
				'Cookie': cookie
			}
		});

		request.on('response', function(response) {

			auvsi.get_response(response, function(data) {

				try {
					auvsi.emit(auvsi.EVENT_KEY_ON_AUVSI_OBSTACLES, [JSON.parse(data)]);
				} catch(e) {
					utils.log(e);
				}

			});

		});

		request.on('error', function(error) {
			utils.log('ERR AUVSI OBSTACLES ' + error.toString());
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
		
		var query = 'latitude=' + telemetry.get_lat() + '&longitude=' + telemetry.get_lon() + '&altitude_msl=' + telemetry.get_alt_msl() + '&uas_heading=' + telemetry.get_heading();
			
		if(mavlink.is_received_message()) {

			// establish http connection to the auvsi uas server
			var request = http.request({

				method: 'POST',
				path: auvsi.connection.api_path_telemetry,
				host: config.get_config('auvsi').host,
				port: config.get_config('auvsi').port,

				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': query.length,
					'Cookie': auvsi.get_cookie()
				}

			});

			request.on('response', function(response) {

				auvsi.get_response(response, function(data) {

					if(data != 'UAS Telemetry Successfully Posted.') {
						return utils.log('ERR POST AUVSI TELEMETRY ' + data);
					}

					mavlink.set_previous_time_boot(mavlink.get_time_boot());

				});

			});

			request.on('error', function(error) {
				utils.log('ERR POST AUVSI TELEMETRY ' + error.toString());
			});

			request.end(query);

		} else {
			utils.log('WARN AUVSI TELEMETRY Awaiting mavlink telemetry...');
		}

	},

	/**
	 * Initialize auvsi module and auvsi api requests.
	 * Loops ten times per second retrieving api data.
	 */
	init: function(callback) {

		if(typeof callback != 'function') {
			callback = function() {};
		}

		callback.call(auvsi);

		auvsi.auth(function(err) {

			if(err) {
				return utils.log('ERR AUVSI AUTH ' + err);
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
	 * Generic post / put request to auvsi server
	 */
	post: function(path, method, data, callback) {

		callback = callback || function() {};

		var request = http.request({
			method: method || 'POST',
			path: path,
			host: config.get_config('auvsi').host,
			port: config.get_config('auvsi').port,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': data.length,
				'Cookie': auvsi.get_cookie()
			}
		});

		request.on('response', function(response) {
			auvsi.get_response(response, function(res_data) {
				callback.call(auvsi, null, res_data);
			});
		});
		request.on('error', function(error) {
			utils.log('ERR AUVSI TELEMETRY ' + error.toString());
			callback.call(auvsi, error);
		});
		request.end(data);

	},

	/**
	 * Generic delete / get request to auvsi server
	 */
	send: function(path, method, callback) {

		callback = callback || function() {};

		var request = http.request({

			method: method || 'GET',
			path: path,
			host: config.get_config('auvsi').host,
			port: config.get_config('auvsi').port,
			headers: {
				'Cookie': auvsi.get_cookie()
			}

		});

		request.on('response', function(response) {
			auvsi.get_response(response, function(res_data) {
				callback.call(auvsi, null, res_data);
			});
		});
		request.on('error', function(err) {
			utils.log('ERR AUVSI ' + error.toString());
			callback.call(auvsi, err);
		});

		request.end();

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

		if(!(data_array instanceof Array)) {
			data_array = [data_array];
		}

		for(var i = 0; i < auvsi.callbacks[event_key].length; i++) {
			auvsi.callbacks[event_key][i].apply(this, data_array);
		}

	}

};


module.exports = auvsi;