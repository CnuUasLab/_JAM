var production 					= false;
	
var http 						= require('http');
	
// mavlink stuff	
var socket 						= require('dgram').createSocket('udp4');
var Mavlink 					= require('mavlink');
var mavlink 					= new Mavlink(0, 0);
	
var username 					= 'newport-falcon';
var password 					= '3813418169';
	
var auvsi_suas_host 			= '10.10.130.10';
var auvsi_suas_port 			= 80;
	
var mavlink_host 				= 'localhost';
var mavlink_port 				= 9550;
	
var auvsi_suas_auth_cookie 		= null;

var received_mavlink_message 	= true;

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

	console.log('Mavlink listener ready');

	socket.on('message', function(message, rinfo) {
		mavlink.parse(message);
	});

	socket.bind(mavlink_port, mavlink_host, function() {
		console.log('Socket bound to port ' + mavlink_port);
	});

	socket.on('listening', function() {
		console.log('Socket listening for data @ ' + socket.address().address);
	});

	socket.on('close', function() {
		console.log('conection closed');
	});

	socket.on('error', function(error) {
		console.log('ERROR>mavlink> An error occurred -> ' + error);
	});

	// mavlink listeners

	/**
	 * Listen for a decoded message
	 */
	mavlink.on('GPS_RAW_INT', function(message, fields) {

		console.log('MAVLink> Mavlink message received (type: GPS_RAW_INIT)');

		if(!received_mavlink_message) {
			received_mavlink_message = true;
		}
		
	});

	mavlink.on('message', function(message, fields) {
		console.log('received mavlink message');
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
				console.log('Initializing post_telemetry loop @ 10Hz');
				console.log('---------------------------------------');
				console.log('');
				post_telemetry();
			}

		});

	});

	request.on('error', function(error) {
		console.log('ERROR>post_telemetry() failure> ' + error.toString());
	});

	request.write(query);

	// loop request every 100ms
	function post_telemetry() {

		// check to see if we've received at least one mavlink message
		if(!received_mavlink_message) {
			console.log('WARN>post_telemetry()> No mavlink messages have been received');
		} else {

			// update query
			query = 'latitude=' + mavlink_message_post_data.latitude + '&longitude=' + mavlink_message_post_data.longitude + '&altitude_msl=' + mavlink_message_post_data.altitude_msl + '&uas_heading=' + mavlink_message_post_data.uas_heading;

			console.log('UAS_TELEMETRY> posting telemetry to auvsi...');
			request.write(query);
		}

		clearTimeout(task);
		task = setTimeout(post_telemetry, 100);

	}

} 