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

/**
 * Store config file data
 */
var config = {
	application: {},
	auvsi: {},
	mavlink: {},
	mavlink_outgoing: {},
	grid: {}
};

var http 						= require('http');
var fs 							= require('fs');

var utils 						= require('./utils.js');
var mavlink 					= require('./mavl.js');
var api 						= require('./api.js');
var telemetry 					= require('./telemetry.js');
var waypoints 					= require('./waypoints.js');
var libsock 					= require('./libsock.js');

var received_mission_count = false;

var request_mission_item_limit = 0;
var request_mission_item_count = 0;
var request_mission_item_isFinished = false;

// temporary waypoint list stored here
// assigned to waypoints.waypoints once
// list is complete
var request_mission_item_list_temp = {};

// init application by reading config file
read_config_file('./config.json', function() {

	// set user module configuration
	api.set_config(config.grid);
	auvsi.set_config(config.auvsi);
	libsock.set_config(config.mavlink);

	init();

});

// used to talk back to the ground station
// note: should only be used once socket is bound
function send_mavlink(message_type, message_body, target_ip, target_port, callback) {

	if(typeof callback != 'function') {
		callback = function() {};
	}

	mavlink.outgoing.createMessage(message_type, message_body, function(message) {

		socket.send(message.buffer, 0, message.buffer.length, target_port, target_ip, function(err, bytes) {

			var response = 'Message sent.';

			if(err) {
				response = err;
				callback.call(this, err, null);
			} else {
				callback.call(this, null, response);
			}
			
		});
		
	});

}

/**
 * parse config file
 */
function read_config_file(filepath, callback) {

	fs.readFile(filepath, function(err, data) {

		if(err) {
			return utils.log('ERR config> Config file not read -> ' + err.toString());
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

			for(var i in contents.mavlink_outgoing) {
				config.mavlink_outgoing[i] = contents.mavlink_outgoing[i];
			}

			for(var i in contents.grid) {
				config.grid[i] = contents.grid[i];
			}

			callback.call(config);

		} catch(err) {
			console.log('ERR config> Invalid config file syntax -> ' + err.toString());
		}

	});

}

/**
 * Start mavlink event listeners and initialize
 * rest of the application / modules
 */
function init() {

	mavlink.init(function() {
		libsock.init(function() {
			auvsi.init();
			init_listeners();
		});
	});

}

function init_listeners() {

	utils.log('interop> ready.');

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

	var telemetryCount = 0;
	var lastTelemetryFreq = 0;
	var telemetryCountUpdated = false;
	var futureTime = (Date.now() / 1000) + 1;

	// listen for response after sending MISSION_REQUEST_LIST message
	mavlink.incoming.on('MISSION_COUNT', function(message, fields) {

		utils.log('mavlink>MISSION_COUNT> received mission count response.');

		if(!received_mission_count) {
			received_mission_count = true;
		}

		request_mission_item_limit = fields.count;
		request_mission_item_count = 0;
		request_mission_item(request_mission_item_count, request_mission_item_limit);

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
			if(!received_mission_count) {
				clearTimeout(request_mission_items.timeout);
				request_mission_items();
			}
		}

	});

	/**
	 * Handle waypoint data from GCS
	 */
	mavlink.incoming.on('MISSION_ITEM', function(message, fields) {

		request_mission_item_count++;

		request_mission_item_list_temp[fields.seq] = fields;

		if(!request_mission_item_isFinished) {
			request_mission_item(request_mission_item_count, request_mission_item_limit);
		} else {
			onMissionItemsReceived(request_mission_item_list_temp);
		}

	});

	mavlink.incoming.on('STATUSTEXT', function(message, fields) {
		console.log('received status text');
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

// assumes socket has been bound
// begins the long, lenghty process of retrieving
// and updating all of the mission waypoints
function request_mission_items() {

	utils.log('mavlink> sending MISSION_REQUEST_LIST...');

	var host = config.mavlink_outgoing.host;
	var port = config.mavlink_outgoing.port;

	send_mavlink('MISSION_REQUEST_LIST', {

		'target_system': 1,
		'target_component': 1

	}, host, port, function(err, response) {

		if(err) {
			return console.log(err);
		}

		clearTimeout(request_mission_items.timeout);
		request_mission_items.timeout = setTimeout(function() {

			// throw error if received_mission_count == false in 30 secs
			if(!received_mission_count) {
				utils.log('ERROR>mavlink_outgoing>mission_request_list>', 'MISSION_COUNT not received in 30 seconds...');
			}

		}, 30000);

	});
}

// called once all waypoints are received from the GCS
function onMissionItemsReceived(tempMissionItems) {

	// reset mission retrieval flags and temp array
	clearTimeout(request_mission_items.timeout);
	received_mission_count = false;

	request_mission_item_limit = 0;
	request_mission_item_count = 0;
	request_mission_item_isFinished = false;

	// our waypoints are stored here
	waypoints.set_waypoints(request_mission_item_list_temp);
	request_mission_item_list_temp = {};

}

function request_mission_item(count, limit) {

	if(count == limit) {
		request_mission_item_isFinished = true;
	}

	utils.log('request_mission_item> requesting item #' + count + ' / ' + limit);

	send_mavlink('MISSION_REQUEST', {
		'target_system': 1,
		'target_component': 1,
		'seq': count
	}, config.mavlink_outgoing.host, config.mavlink_outgoing.port, function(err, response) {
		utils.log('mavlink>MISSION_REQUEST> sent MISSION_ITEM request');
	});	

}

function bind_udp_socket(callback) {

	////--

}

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
