/**
 * Interoperability script. Authenticates with auvsi server
 * listens for mavlink packets through udp4 socket
 * posts groundstation telemetry to auvsi server ten times per
 * second. GETs auvsi server time every second. Gets SDA
 * obstacle information from auvsi server every second, converts
 * obstacle information into mavlink waypoints and reuses the 
 * same udp socket used for receiving telemetry to send auvsi
 * server obstacle information to mavproxy groundstation.
 *
 * TODO: fetch auvsi obstacle and server data under a single setTimeout function
 * TODO: convert obstacle object list into waypoints and send it to autopilot
 *
 * @author juanvallejo
 * @date 6/20/15
 */

// configuration
var config = {
	application: {},
	auvsi: {},
	mavlink: {}
};

var http 						= require('http');
var io 							= require('socket.io');
var fs 							= require('fs');

// mavlink stuff	
var socket 						= require('dgram').createSocket('udp4');
var Mavlink 					= require('mavlink');
var mavlink 					= new Mavlink(0, 0);

var mavlink_isReady 			= false;
		
var auvsi_suas_auth_cookie 		= null;

var previous_mavlink_time_boot 	= 0;
var mavlink_time_boot 			= 0;

var received_mavlink_message 	= false;

var server_data 				= null;
var obstacle_data 				= null;

// callbacks
callbacks_mavlink_onready 		= [];
callbacks_mavlink_received 		= [];

// socket.io
var socket_io_clients 			= {};

// contain waypoint data
var mavlink_message_post_data = { 
	latitude: '0',
	longitude: '0',
	altitude_msl: '0',
	uas_heading: '0'
};

// mavlink finishes loading definitions
mavlink.on('ready', function() {

	mavlink_isReady = true;

	for(var i = 0; i < callbacks_mavlink_onready.length; i++) {
		callbacks_mavlink_onready[i].call(mavlink);
	}

});

// init application by reading config file
read_config_file('./config.json', function() {

	// load local auvsi default settings
	// if not in production
	if(!config.application.in_production) {

		config.auvsi.username 	= 'uas';
		config.auvsi.password 	= 'devel';
		config.auvsi.host 		= '137.155.2.166';
		config.auvsi.port 		= 80;

	}

	mav_do_init();

});

/**
 * parse config file
 */
function read_config_file(filepath, callback) {

	fs.readFile(filepath, function(err, data) {

		if(err) {
			return log('ERR config> Config file not read -> ' + err.toString());
		}

		try {

			var contents = JSON.parse(data);

			for(var i in contents.application) {
				config.application[i] = contents.application[i];
			}

			for(var i in contents.auvsi) {
				config.auvsi[i] = contents.auvsi[i];
			}

			for(var i in contents.mavlink) {
				config.mavlink[i] = contents.mavlink[i];
			}

			callback.call(config);

		} catch(err) {
			console.log('ERR config> Invalid config file syntax -> ' + err.toString());
		}

	});

}

/**
 * Start mavlink event listeners
 */
function mav_do_init() {

	// determine if mavlink ready event has already been fired
	if(mavlink_isReady) {
		mavlink_init_listeners();
	} else {
		callbacks_mavlink_onready.push(mavlink_init_listeners);
	}

	function mavlink_init_listeners() {

		log('mavlink> ready.');

		// bind udp socket between computer and
		// groundstation and begin communications
		// with auvsi server
		bind_udp_socket(function() {
			auvsi_do_auth();
		});

		var telemetryCount = 0;
		var lastTelemetryFreq = 0;
		var telemetryCountUpdated = false;
		var futureTime = (Date.now() / 1000) + 1;

		/**
		 * Listen for a decoded message
		 */
		mavlink.on('GLOBAL_POSITION_INT', function(message, fields) {

			telemetryCountUpdated = false;
			telemetryCount++;

			if((Date.now() / 1000) >= futureTime) {
				futureTime = (Date.now() / 1000) + 1;
				lastTelemetryFreq = telemetryCount;
				telemetryCountUpdated = true;
				telemetryCount = 0;
			}

			// update mavlink_message_post_data
			mavlink_time_boot						= fields['time_boot_ms'];
			mavlink_message_post_data.latitude 		= fields['lat'] / (Math.pow(10, 7));
			mavlink_message_post_data.longitude 	= fields['lon'] / (Math.pow(10, 7));
			mavlink_message_post_data.altitude_msl 	= fields['alt'] * '0.00328084';
			mavlink_message_post_data.uas_heading 	= fields['hdg'] / 100;

			// check for appropriate telemetry values
			if(mavlink_message_post_data.latitude > 90) {
				mavlink_message_post_data.latitude = 90;
			}

			if(mavlink_message_post_data.latitude < -90) {
				mavlink_message_post_data.latitude = -90;
			}

			if(mavlink_message_post_data.longitude > 180) {
				mavlink_message_post_data.longitude = 180;
			}

			if(mavlink_message_post_data.longitude < -180) {
				mavlink_message_post_data.longitude = -180;
			}

			if(mavlink_message_post_data.uas_heading > 360) {
				mavlink_message_post_data.uas_heading = 360;
			}

			if(mavlink_message_post_data.uas_heading < 0) {
				mavlink_message_post_data.uas_heading = 0;
			}

			if(!received_mavlink_message) {
				received_mavlink_message = true;
			}

			// send mavlink event to all socket.io clients
			for(var i in socket_io_clients) {
				if(telemetryCountUpdated) {
					socket_io_clients[i].emit('frequency_status', { frequency: lastTelemetryFreq });
				}
				socket_io_clients[i].emit('mavlink', mavlink_message_post_data);
			}
			
			// callbacks
			for(var i = 0; i < callbacks_mavlink_received.length; i++) {
				if(typeof callbacks_mavlink_received[i] == 'function') {
					callbacks_mavlink_received[i].call(this, auvsi_suas_auth_cookie);
				}
			}
			
		});

	}
}


function bind_udp_socket(callback) {

	socket.bind(config.mavlink.port, config.mavlink.host, function() {
		log('udp_socket> Socket connection established.');
	});

	// once socket is listening on the port
	// call our callback function and continue
	// the program's execution
	socket.on('listening', function() {
		log('udp_socket> Listening on port ' + config.mavlink.port);
		callback.call(socket);
	});

	socket.on('close', function() {
		log('udp_socket> Socket connection closed.');
	});

	socket.on('error', function(error) {
		log('ERR udp_socket> ' + error.toString());
	});

	socket.on('message', function(message, rinfo) {
		mavlink.parse(message);
	});

}

/**
 * authenticate with auvsi server
 */
function auvsi_do_auth() {

	var query = 'username=' + config.auvsi.username + '&password=' + config.auvsi.password;

	var request = http.request({
		method: 'POST',
		path: '/api/login',
		host: config.auvsi.host,
		port: config.auvsi.port,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': query.length
		}
	});

	request.on('response', function(response) {
		auvsi_util_parse_response(response, function(data) {

			// if server returns successful connection
			// 	set auth cookie as global variable and
			// 	call interoperability functions
			// else advertise invalid login data
			if(data == 'Login Successful.') {

				auvsi_suas_auth_cookie = response.headers['set-cookie'][0];
				auvsi_get_info(auvsi_suas_auth_cookie);
				auvsi_get_obstacles(auvsi_suas_auth_cookie);

				// add auvsi_post_telemetry function to callbacks_mavlink_received
				// it runs every time a new message is received
				callbacks_mavlink_received.push(auvsi_post_telemetry);

			} else {
				log('ERR auvsi>function>auth> ' + data);
			}

		});
	});

	request.on('error', function(error) {

		// if auvsi server is down, keep trying
		// to connect every 3 seconds until it's up
		// max number of attempts is 100
		if(error.code == 'ECONNREFUSED') {

			if(!auvsi_do_auth.timeout_attempts) {
				auvsi_do_auth.timeout_attempts = 0;
			}

			auvsi_do_auth.timeout_attempts++;

			if(auvsi_do_auth.timeout_attempts > 100) {
				return log('ERR auvsi>function>auth> Maximum number of login attempts exceeded. Unable to establish a connection to auvsi server.');
			}

			log('WARN auvsi>function>auth> Unable to connect to auvsi server. Retrying...');
			
			clearTimeout(auvsi_do_auth.timeout);
			auvsi_do_auth.timeout = setTimeout(auvsi_do_auth, 3000);
			
		} else {
			log('ERR auvsi>function>auth> ' + error.toString());
		}

	});

	request.end(query);

}

/**
 * GET auvsi obstacle list, server time, message, message timestamp
 */
function auvsi_get_info(cookie) {

	var server_data_timeout = setTimeout(function sdt() {

		var request = http.request({
			method: 'GET',
			path: '/api/server_info',
			host: config.auvsi.host,
			port: config.auvsi.port,
			headers: {
				'Cookie': cookie
			}
		});

		request.on('response', function(response) {
			auvsi_util_parse_response(response, function(data) {

				if(!data) {
					return console.log('API ERR /api/server_info ' + data);
				}

				try {

					var server_time;

					server_data = JSON.parse(data);
					// console.log('DATA', server_data);
					// server_time = server_data['server_time'];
					// server_data = server_data['server_info'];
					// server_data['server_time'] = server_time;

					for(var i in socket_io_clients) {
						socket_io_clients[i].emit('server_info', server_data);
					}

				} catch(e) {
					log('API ERR /api/server_info -> ' + e);
				}

			});
		});

		request.on('error', function(error) {
			log('ERR auvsi_get_info() failure> ' + error.toString());
		});

		request.end();

		clearTimeout(server_data_timeout);
		var server_data_timeout = setTimeout(sdt, 1000);

	}, 100);

}

/**
 * fetch sda obstacle data from auvsi server requires
 * authorization cookie as the first parameter.
 */
function auvsi_get_obstacles(cookie) {

	var obstacle_data_timeout = setTimeout(function odt() {

		var request = http.request({
			method: 'GET',
			path: '/api/obstacles',
			host: config.auvsi.host,
			port: config.auvsi.port,
			headers: {
				'Cookie': cookie
			}
		});

		request.on('response', function(response) {
			auvsi_util_parse_response(response, function(data) {

				try {

					obstacle_data = JSON.parse(data);

					// send obstacle data as a json object to localhost clients
					for(var i in socket_io_clients) {
						socket_io_clients[i].emit('obstacle_data', obstacle_data);
					}

					// convert obstacle object into mavlink waypoints message and send it to
					// groundstation here

				} catch(e) {
					log(e);
				}

			});

		});

		request.on('error', function(error) {
			log('ERR auvsi>function>obstacles> ' + error.toString());
		});

		request.end();

		clearTimeout(obstacle_data_timeout);
		obstacle_data_timeout = setTimeout(odt, 1000);

	}, 100);

}

/**
 * post waypoints received from ground station to auvsi server
 * at 10Hz
 */
function auvsi_post_telemetry(cookie) {
	
	// holds our loop object
	var task = null;
	var query = 'latitude=' + mavlink_message_post_data.latitude + '&longitude=' + mavlink_message_post_data.longitude + '&altitude_msl=' + mavlink_message_post_data.altitude_msl + '&uas_heading=' + mavlink_message_post_data.uas_heading;
	var post_telemetry_called = false;

	// loop request every 100ms
	// setTimeout(function post_telemetry() {
		
		// update query
		query = 'latitude=' + mavlink_message_post_data.latitude + '&longitude=' + mavlink_message_post_data.longitude + '&altitude_msl=' + mavlink_message_post_data.altitude_msl + '&uas_heading=' + mavlink_message_post_data.uas_heading;

		if(received_mavlink_message) {

			// establish http connection to the auvsi uas server
			var request = http.request({
				method: 'POST',
				path: '/api/telemetry',
				host: config.auvsi.host,
				port: config.auvsi.port,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': query.length,
					'Cookie': cookie
				}
			});

			request.on('response', function(response) {
				auvsi_util_parse_response(response, function(data) {

					if(data == 'UAS Telemetry Successfully Posted.') {

						if(previous_mavlink_time_boot == mavlink_time_boot) {
							log('No new telemetry received. Posting previously received telemetry...');
						} else {
							log('Successfully posted updated telemetry.');
						}

						previous_mavlink_time_boot = mavlink_time_boot;

					} else {
						log('ERR auvsi>function>telemetry> ' + data);
					}

				});
			});

			request.on('error', function(error) {
				log('ERR auvsi>function>telemetry> ' + error.toString());
			});

			request.end(query);

		} else {
			log('WARN auvsi>function>telemetry> Awaiting mavlink telemetry...');
		}

		// clearTimeout(task);
		// task = setTimeout(post_telemetry, 100);

	// }, 100);

}

/**
 * parse body of an http response and return response data
 */
function auvsi_util_parse_response(response, callback) {

	var data = '';

	response.on('data', function(chunk) {
		data += chunk;
	});

	response.on('end', function() {
		callback.call(socket, data);
	});

}

/**
 * Custom log function. Handles
 * repetitive logging and log caching
 */
function log(message) {

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

var server_router = {
	'/': '/index.html',
	'/map': '/map_app/index.html'
};

// create server for web pages
var server = http.createServer(function(request, response) {

	var file = server_router[request.url] || request.url;
	console.log('serving ' + file);

	fs.readFile(__dirname + file, function(err, data) {

		if(err) {
			response.writeHead(404);
			return response.end('404. File not found.');
		}

		response.writeHead(200, { 'Content-Type': 'text/html' });
		response.end(data);

	});

});

server.listen(8000, '0.0.0.0');

server.on('error', function (e) {
	if (e.code == 'EADDRINUSE') {
		console.log('ERROR: http server port already in use, exiting');
		process.exit(1);
	} else {
		console.log('ERROR: Error in http server ' + e);
	}
});

io.listen(server).on('connection', function(client) {

	log('socket.io>client> ' + client.id + ' has connected');
	socket_io_clients[client.id] = client;

	if(server_data) {
		client.emit('server_info', server_data);
	}

	if(obstacle_data) {
		client.emit('obstacle_data', obstacle_data);
	}

	client.on('disconnect', function() {
		delete socket_io_clients[client.id];
	});

});
