var production 					= false;
	
var http 						= require('http');
var io 							= require('socket.io');
var fs 							= require('fs');

// mavlink stuff	
var socket 						= require('dgram').createSocket('udp4');
var Mavlink 					= require('mavlink');
var mavlink 					= new Mavlink(0, 0);
	
var username 					= 'newport-falcon';
var password 					= '3813418169';
	
var auvsi_suas_host 			= '10.10.130.10';
var auvsi_suas_port 			= 80;
	
var mavlink_host 				= '0.0.0.0';
var mavlink_port 				= 14552;
	
var auvsi_suas_auth_cookie 		= null;

var previous_mavlink_time_boot 	= 0;
var mavlink_time_boot 			= 0;

var received_mavlink_message 	= false;

var server_data = null;
var obstacle_data = null;

// socket.io shit
var socket_io_clients = {};

// contain waypoint data
var mavlink_message_post_data = { 
	latitude: '0',
	longitude: '0',
	altitude_msl: '0',
	uas_heading: '0'
};

//
if(!production) {

	username = 'test';
	password = 'test';
	auvsi_suas_host = 'localhost';
	auvsi_suas_port = 8080;

}

var loginQuery = 'username=' + username + '&password=' + password; 

// mavlink listener
mavlink.on('ready', function() {

	console.log('Mavlink> listener ready');

	socket.on('message', function(message, rinfo) {
		mavlink.parse(message);
	});

	socket.bind(mavlink_port, mavlink_host, function() {
		console.log('Mavlink> socket bound to port ' + mavlink_port);
	});

	socket.on('listening', function() {
		console.log('Mavlink> socket listening for data @ ' + socket.address().address);
	});

	socket.on('close', function() {
		console.log('Mavlink> socket conection closed');
	});

	socket.on('error', function(error) {
		console.log('ERROR>mavlink> An error occurred -> ' + error);
	});

	// mavlink listeners

	/**
	 * Listen for a decoded message
	 */
	mavlink.on('GLOBAL_POSITION_INT', function(message, fields) {

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

		// console.log('MAVLink> Mavlink message received (type: GPS_RAW_INIT)');

		if(!received_mavlink_message) {
			received_mavlink_message = true;
		}

		// send mavlink event to all socket.io clients
		for(var i in socket_io_clients) {
			socket_io_clients[i].emit('mavlink', mavlink_message_post_data);
		}
		
	});

	mavlink.on('message', function(message, fields) {
		// console.log('received mavlink message');
	});

});


// login
var loginAction = http.request({
	method: 'POST',
	path: '/api/login',
	host: auvsi_suas_host,
	port: auvsi_suas_port,
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Content-Length': loginQuery.length
	}
});


loginAction.write(loginQuery);
loginAction.end();

loginAction.on('response', function(response) {

	// response contains authentication cookie
	var responseData = '';

	response.on('data', function(chunk) {
		responseData += chunk;
	});

	response.on('end', function() {

		// check response status (200 ok)
		if(responseData == 'Login Successful.') {

			// save cookie and begin rest of tasks
			auvsi_suas_auth_cookie = response.headers['set-cookie'][0];
			getServerData(auvsi_suas_auth_cookie);
			getObstacleInformation(auvsi_suas_auth_cookie);
			beginPostingTelemetry(auvsi_suas_auth_cookie);

		}

	});

});

// setTimeout(postTelemetry, 100);

loginAction.on('error', function(error) {
	console.log('ERROR>authentication failure> ' + error.toString());
});

// retrieve server time, etc...
function getServerData(authCookie) {

	var request = http.request({
		method: 'GET',
		path: '/api/interop/server_info',
		host: auvsi_suas_host,
		port: auvsi_suas_port,
		headers: {
			'Cookie': authCookie
		}
	});

	request.on('response', function(response) {

		var responseData = '';

		response.on('data', function(chunk) {
			responseData += chunk;
		});

		response.on('end', function() {

			console.log('----------- Server Data [Interop Task 1] ----------');
			console.log('');
			console.log(responseData);
			console.log('');
			console.log('---------- /Server Data [Interop Task 1]/ ---------');
			console.log('');

			// advertise server info to browser
			try {

				var server_time;

				server_data = JSON.parse(responseData);
				server_time = server_data['server_time'];
				server_data = server_data['server_info'];
				server_data['server_time'] = server_time;

			} catch(e) {
				console.log(e);
			}

		});

	});

	request.on('error', function(error) {
		console.log('ERROR>getServerData() failure> ' + error.toString());
	});

	request.end();

}

// get obstacle data
function getObstacleInformation(authCookie) {

	var request = http.request({
		method: 'GET',
		path: '/api/interop/obstacles',
		host: auvsi_suas_host,
		port: auvsi_suas_port,
		headers: {
			'Cookie': authCookie
		}
	});

	request.on('response', function(response) {

		var responseData = '';

		response.on('data', function(chunk) {
			responseData += chunk;
		});

		response.on('end', function() {

			console.log('----------- Obstacle Data [Interop Task 2] ----------');
			console.log('');
			console.log(responseData);
			console.log('');
			console.log('---------- /Obstacle Data [Interop Task 2]/ ---------');
			console.log('');

			// advertise obstacle data to browser
			try {
				obstacle_data = JSON.parse(responseData);
			} catch(e) {
				console.log(e);
			}

		});

	});

	request.on('error', function(error) {
		console.log('ERROR>getObstacleInformation() failure> ' + error.toString());
	});

	request.end();

}

// post waypoints received from round station
function beginPostingTelemetry(authCookie) {

			
	// holds our loop object
	var task = null;
	var query = 'latitude=' + mavlink_message_post_data.latitude + '&longitude=' + mavlink_message_post_data.longitude + '&altitude_msl=' + mavlink_message_post_data.altitude_msl + '&uas_heading=' + mavlink_message_post_data.uas_heading;
	var post_telemetry_called = false;

	// loop request every 100ms
	setTimeout(function post_telemetry() {
		
		// update query
		query = 'latitude=' + mavlink_message_post_data.latitude + '&longitude=' + mavlink_message_post_data.longitude + '&altitude_msl=' + mavlink_message_post_data.altitude_msl + '&uas_heading=' + mavlink_message_post_data.uas_heading;

		if(received_mavlink_message) {

			// establish http connection to the auvsi uas server
			var request = http.request({
				method: 'POST',
				path: '/api/interop/uas_telemetry',
				host: auvsi_suas_host,
				port: auvsi_suas_port,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': query.length,
					'Cookie': authCookie
				}
			});

			request.on('response', function(response) {

				var data = '';

				response.on('data', function(chunk) {
					data += chunk;
				});

				response.on('end', function() {

					if(data == 'UAS Telemetry Successfully Posted.') {

						if(previous_mavlink_time_boot == mavlink_time_boot) {
							console.log('No new telemetry received. Posting previously received telemetry.');
						} else {
							console.log('Successfully posted updated telemetry.');
						}

						previous_mavlink_time_boot = mavlink_time_boot;

						console.log('');

					} else {
						console.log('ERR>post_telemetry() failure> ' + data);
					}

				});

			});

			request.on('error', function(error) {
				console.log('ERROR>post_telemetry() failure> ' + error.toString());
			});

			console.log('post_telemetry()> Posting telemetry()');
			request.end(query);

		} else {
			console.log('WARN>post_telemetry()> No mavlink data has been received, posting blank data.');
		}

		clearTimeout(task);
		task = setTimeout(post_telemetry, 100);

	}, 100);

}

// create server for web pages
var server = http.createServer(function(request, response) {

	if(request.url == '/' || request.url == '/index.html') {
		fs.readFile(__dirname + '/index.html', function(err, data) {

			if(err) {
				response.writeHead(404);
				return response.end('404. File not found.');
			}

			response.writeHead(200, { 'Content-Type': 'text/html' });
			response.end(data);

		});
	} else {
		response.end('404. File not found.');
	}

});

server.listen(8000, '0.0.0.0');

io.listen(server).on('connection', function(client) {

	console.log('socket.io> client has connected');
	socket_io_clients[client.id] = client;

	if(server_data) {
		client.emit('server_info', server_data);
	}

	if(obstacle_data) {
		client.emit('obstacle_data', obstacle_data);
	}

});