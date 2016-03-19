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

var utils 						= require('./utils.js');
var auvsi 						= require('./auvsi.js');
var api 						= require('./api.js');
var mavlink 					= require('./mavl.js');
var mission 					= require('./mission.js');
var telemetry 					= require('./telemetry.js');
var waypoints 					= require('./waypoints.js');
var libsock 					= require('./libsock.js');
var server 						= require('./server.js');
var config 						= require('./config.js');

/**
 * Initialize module event listeners
 * Listen for mavlink messages and auvsi
 * api data
 */
function init_listeners() {

	utils.log('_JAM V1.0');

	var telemetryCount = 0;
	var lastTelemetryFreq = 0;
	var telemetryCountUpdated = false;
	var futureTime = (Date.now() / 1000) + 1;

	libsock.on('message', function(message, rinfo) {
		mavlink.incoming.parse(message);
	});

	// subscribe to websocket connection events
	server.on('connection', function(client) {

		utils.log('server>client> ' + client.id + ' has connected');
		libsock.io_register(client.id, client);

		client.on('disconnect', function() {
			libsock.io_unregister(client.id);
		});

	});

	// subscribe to http request events
	server.on('request', function(request, response, path) {

		if(path.match(/\/api\/.*/gi)) {
			
			if(path.match(/\/api\/grid/gi)) {
				return server.receive_api_grid_request(request, response, 
					api.get_grid_details(telemetry, waypoints));
			}

			if(path.match(/\/api\/path/gi)) {
				return server.receive_api_path_request(request, response);
			}
			
			// relay /api/target requests to interop
			if(path.match(/\/api\/targets(\/)?.*/gi)) {
				return server.receive_api_target_request(request, response, auvsi);
			}

			return server.receive_api_request(request, response, server.REQUEST_API_IS_INVALID);
		}

		server.receive_request(request, response, path);

	});

	server.on('error', function(e) {

		if (e.code == 'EADDRINUSE') {
			console.log('ERROR: http server port already in use, exiting');
			process.exit(1);
		} else {
			console.log('ERROR: Error in http server ' + e);
		}

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
		console.log('_JAM WAYPOINTS', 'received', data);
		waypoints.set_waypoints(data);
	});

	// handle mission errors
	mission.on('error', function(err) {
		utils.log(err);
	});

	// listen for response after sending MISSION_REQUEST_LIST message
	mavlink.incoming.on('MISSION_COUNT', function(message, fields) {
		mission.waypoints_count_limit = fields.count;
		mission.receive_waypoint_count(libsock, mavlink, fields.count);
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
				mission.request_waypoints(libsock, mavlink);
			}

		}

	});

	/**
	 * Handle waypoint data from GCS
	 */
	mavlink.incoming.on('MISSION_ITEM', function(message, fields) {
		mission.receive_waypoint(libsock, mavlink, fields, mission.waypoints_count_limit);
	});

	mavlink.incoming.on('STATUSTEXT', function(message, fields) {
		utils.log('MAVLINK INCOMING received status text');
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
			server.init();
			init_listeners();
		});
	});

})();
