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
 * @author juanvallejo
 * @date 6/20/15
 */

var http 						= require('http');
var fs 							= require('fs');
var io 							= require('socket.io');

var utils 						= require('./utils.js');
var auvsi 						= require('./auvsi.js');
var mavlink 					= require('./mavl.js');
var api 						= require('./api.js');
var mission 					= require('./mission.js');
var telemetry 					= require('./telemetry.js');
var waypoints 					= require('./waypoints.js');
var libsock 					= require('./libsock.js');
var config 						= require('./config.js');

/**
 * Initialize module event listeners
 * Listen for mavlink messages and auvsi
 * api data
 */
function init_listeners() {

	utils.log('interop> ready.');

	var telemetryCount = 0;
	var lastTelemetryFreq = 0;
	var telemetryCountUpdated = false;
	var futureTime = (Date.now() / 1000) + 1;

	libsock.on('message', function(message, rinfo) {
		mavlink.incoming.parse(message);
	});

	// subscribe to auvsi server info events
	auvsi.on('info', function(data) {
		libsock.io_broadcast('server_info', data);
	});

	// subscribe to auvsi obstacle events
	auvsi.on('obstacles', function(data) {
		libsock.io_broadcast('obstacle_data', data);
	});

	// subscribe to mission waypoints received events
	mission.on('waypoints', function(data) {
		waypoints.set_waypoints(data);
	});

	// handle mission errors
	mission.on('error', function(err) {
		utils.log(err);
	});

	// listen for response after sending MISSION_REQUEST_LIST message
	mavlink.incoming.on('MISSION_COUNT', function(message, fields) {
		utils.log('mavlink>MISSION_COUNT> received mission count response.');
		mission.receive_waypoint_count(fields.count, libsock);
	});

	// retireve current waypoint
	mavlink.incoming.on('MISSION_CURRENT', function(message, fields) {

		// determine if waypoint exists
		// and update waypoints for api
		if(waypoints.get_waypoint(fields.seq)) {

			// setting the current waypoint also sets the
			// next, previous, and following waypoints
			waypoints.set_current_waypoint(fields.seq);

		} else {

			// assume no waypoints have been requested / loaded
			if(!mission.is_received_waypoint_count()) {
				mission.request_waypoints(mavlink, libsock);
			}

		}

	});

	/**
	 * Handle waypoint data from GCS
	 */
	mavlink.incoming.on('MISSION_ITEM', function(message, fields) {
		mission.receive_waypoint(fields, libsock);
	});

	mavlink.incoming.on('STATUSTEXT', function(message, fields) {
		utils.log('mavl>incoming> received status text');
	});

	/**
	 * Handle plane location telemetry from GCS
	 */
	mavlink.incoming.on('GLOBAL_POSITION_INT', function(message, fields) {

		telemetryCountUpdated = false;
		telemetryCount++;

		if((Date.now() / 1000) >= futureTime) {
			futureTime = (Date.now() / 1000) + 1;
			lastTelemetryFreq = telemetryCount;
			telemetryCountUpdated = true;
			telemetryCount = 0;
		}

		// update telemetry
		mavlink.set_time_boot(fields['time_boot_ms']);

		telemetry.set_lat(fields['lat'] / (Math.pow(10, 7)));
		telemetry.set_lon(fields['lon'] / (Math.pow(10, 7)));
		telemetry.set_alt_msl(fields['alt'] * 0.00328084);
		telemetry.set_heading(fields['hdg'] / 100);

		// check for appropriate telemetry values
		if(telemetry.get_lat() > 90) {
			telemetry.set_lat(90);
		}

		if(telemetry.get_lat() < -90) {
			telemetry.set_lat(-90);
		}

		if(telemetry.get_lon() > 180) {
			telemetry.set_lon(180);
		}

		if(telemetry.get_lon() < -180) {
			telemetry.set_lon(-180);
		}

		if(telemetry.get_heading() > 360) {
			telemetry.set_heading(360);
		}

		if(telemetry.get_heading() < 0) {
			telemetry.set_heading(0);
		}

		if(!mavlink.is_received_message()) {
			mavlink.is_received_message(true);
		}

		// post telemetry to auvsi
		auvsi.post_telemetry(telemetry, mavlink);

		// send mavlink event to all socket.io clients
		libsock.io_broadcast('mavlink', telemetry);
		
		if(telemetryCountUpdated) {
			libsock.io_broadcast('frequency_status', { frequency: lastTelemetryFreq });
		}
		
	});

}

/**
 * Start mavlink event listeners and initialize
 * rest of the application / modules
 */
(function init() {

	// set user module configuration
	mavlink.init(function() {
		libsock.init(function() {
			auvsi.init();
			init_listeners();
		});
	});

})();

/**
 * Incoming /api/* requests handled here
 */
function handleAPIRequest(request, response, path) {

	response.writeHead(200, {'Content-Type': 'application/json'});

	if(path.match(/\/api\/grid/gi)) {

		var grid = api.get_grid_details(telemetry, waypoints);

		try {
			response.end(JSON.stringify(grid));
		} catch(e) {
			response.writeHead(500, {'Content-Type': 'text/plain'});
			response.end(e.toString());
		}

		return;
	}

	if(path.match(/\/api\/path/gi) && request.type.toLowerCase() == 'put') {

		response.end();
		return;

	}

	// assume invalid request
	response.writeHead(404, {'Content-Type': 'text/plain'});
	response.end('Invalid endpoint.');

}

var server_router = {
	'/': '/index.html',
	'/map': '/map_app/index.html'
};

// create server for web pages
var server = http.createServer(function(request, response) {

	var path = server_router[request.url] || request.url;
	console.log('serving ' + path);

	if(path.match(/\/api\/.*/gi)) {
		
		handleAPIRequest(request, response, path);

		return;
	}

	fs.readFile(__dirname + path, function(err, data) {

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

	utils.log('socket.io>client> ' + client.id + ' has connected');
	libsock.io_register(client.id, client);

	client.on('disconnect', function() {
		libsock.io_unregister(client.id);
	});

});
