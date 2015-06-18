var http 					= require('http');

// mavlink stuff
var socket 					= require('dgram').createSocket('udp4');
var Mavlink 				= require('mavlink');
var mavlink 				= new Mavlink(0, 0);

var username 				= 'newport-falcon';
var password 				= '3813418169';
var loginQuery 				= 'username=' + username + '&password=' + password; 

var auvsi_suas_host 		= '10.10.130.10';
var auvsi_suas_port 		= 80;

var mavlink_host 			= 'localhost';
var mavlink_port 			= 9550;

var auvsi_suas_auth_cookie 	= null

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

		// call callback
		if(typeof callback == 'function') {
			callback.call(MavlinkListener, message, fields);
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
		console.log(responseData);
		// check response status (200 ok)
		if(responseData == 'Login Successful.') {

			console.log('AUTH successful, auth cookie = ');

			// save cookie
			auvsi_suas_auth_cookie = response.headers['set-cookie'][0];
			// getServerData(auvsi_suas_auth_cookie);

			console.log(auvsi_suas_auth_cookie);

		}

	});

});

loginAction.on('error', function(error) {
	console.log('ERROR>authentication failure> ' + error.toString());
});

loginAction.write('username=test&password=test');
loginAction.end();

// retrieve server time, etc...
function getServerData(authCookie) {

	console.log('fetching server data...');

	var request = http.request({
		method: 'GET',
		path: '/api/interop/server_info',
		host: auvsi_suas_host,
		port: auvsi_suas_port,
		headers: {
			'Set-Cookie': authCookie.split(';')[0]
		}
	});

	request.on('response', function(response) {

		var responseData = '';

		response.on('data', function(chunk) {
			responseData += chunk;
		});

		response.on('end', function() {

			console.log(responseData);
			// var data = JSON.parse(responseData);

			// // check response status (200 ok)
			// if(data.status == 200) {
			// 	console.log('RunOnce> Successfully received server data:');
			// 	console.log(responseData);
			// }

		});

	});

	request.on('error', function(error) {
		console.log('ERROR>getServerData() failure> ' + error.toString());
	});

	request.end();

}

// post waypoints received from round station
function postTelemetry(authCookie, connection) {



} 