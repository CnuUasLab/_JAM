/**
 * Mission library and utils
 */

var config = require('./config.js');
var utils = require('./utils.js');

var mission = {

	waypoints_request_timeout: null,
	waypoints_received_count: false,
	waypoints_request_isFinished: true,
	waypoints_count: 0,
	waypoints_count_limit: 0,

	EVENT_KEY_ON_MISSION_WAYPOINTS: 'waypoints',
	EVENT_KEY_ON_MISSION_WAYPOINT: 'waypoint',
	EVENT_KEY_ON_MISSION_ERROR: 'error',

	callbacks: {},

	// temp list of mission items
	mission_items: {},

	/**
	* Determines if a waypoint count for the current mission
	* has been received from the ground station
	*
	* @param arg 	Boolean 	setting the new waypoints_received_count state
	*/
	is_received_waypoint_count: function(arg) {

		if(arg) {
			var prev_state = mission.waypoints_received_count;
			mission.waypoints_received_count = arg;
			return prev_state;
		}

		return mission.waypoints_received_count;

	},

	/**
	 * Called any time a waypoint is received
	 *
	 * @param waypoint
	 * @param libsock 	Object 	socket manager, used to request a new waypoint by
	 * 	using the mavlink outgoing socket to send a message to the ground station.
	 * @emits mission.EVENT_KEY_ON_WAYPOINT
	 */
	receive_waypoint: function(waypoint, libsock) {

		mission.waypoints_count++;

		mission.mission_items[waypoint.seq] = waypoint;
		mission.emit(mission.EVENT_KEY_ON_WAYPOINT);

		if(!mission.waypoints_request_isFinished) {
			mission.request_waypoint(mission.waypoints_count, libsock);
		} else {
			mission.end_request_waypoints();
		}

	},

	/**
	 * Receives total number of waypoints to fetch.
	 * Receiving a waypoint count begins starts a new process
	 * of fetching waypoints. When this process is finished,
	 * a mission.EVENT_KEY_ON_WAYPOINTS event is emitted.
	 *
	 * @param limit 	int 	total number of waypoints to request
	 * @param libsock 	Object 	socket manager, used to request a new waypoint by
	 * 	using the mavlink outgoing socket to send a message to the ground station.
	 */
	receive_waypoint_count: function(limit, libsock) {

		if(!mission.is_received_waypoint_count(true)) {
			clearTimeout(mission.waypoints_request_timeout);
		}

		mission.waypoints_count_limit = limit;
		mission.waypoints_count = 0;
		mission.request_waypoint(0, libsock);

	},

	/**
 	 * Request a single mission waypoint
 	 *
 	 * @param count 	int 	index of item being requested
 	 * @param libsock 	Object 	socket manager, used to request a new waypoint by
	 * 	using the mavlink outgoing socket to send a message to the ground station.
	 */
	request_waypoint: function(count, libsock) {

		if(count == mission.waypoints_count_limit) {
			mission.waypoints_request_isFinished = true;
		}

		utils.log('request_mission_item> requesting item #' + count + ' / ' + limit);

		mavlink.send_message(libsock, 'MISSION_REQUEST', {

			'target_system': 1,
			'target_component': 1,
			'seq': count

		}, config.get_config('mavlink').outgoing_host, config.get_config('mavlink').outgoing_port, function(err, response) {
			utils.log('mavlink>MISSION_REQUEST> sent MISSION_ITEM request');
		});	

	},

	/**
	 * Sends a mavlink message to the ground station
	 * requesting a new mission count. This begins the
	 * waypoint-fetching process.
	 *
	 * @param mavlink 	Object 	mavlink manager
	 * @emits mission.EVENT_KEY_ON_MISSION_ERROR if a response to
	 *	waypoints request does not happen in less than 30 seconds.
	 */
	request_waypoints: function(mavlink, libsock) {

		utils.log('mavlink> sending MISSION_REQUEST_LIST...');

		clearTimeout(mission.waypoints_request_timeout);

		var host = config.get_config('mavlink').outgoing_host;
		var port = config.get_config('mavlink').outgoing_port;

		mavlink.send_message(libsock, 'MISSION_REQUEST_LIST', {

			'target_system': 1,
			'target_component': 1

		}, host, port, function(err, response) {

			if(err) {
				return utils.log(err);
			}

			clearTimeout(mission.waypoints_request_timeout);
			mission.waypoints_request_timeout = setTimeout(function() {

				// throw error if received_mission_count == false in 30 secs
				if(!mission.is_received_waypoint_count()) {
					mission.emit('error', ['ERROR>mavlink_outgoing>mission_request_list> MISSION_COUNT not received in 30 seconds...']);
				}

			}, 30000);

		});

	},
 	 
	/**
	 * Ends a request for n amount of waypoints begun
	 * by calling mission.request_waypoints.
	 *
	 * @emits mission.EVENT_KEY_ON_WAYPOINTS
	 */
	end_request_waypoints: function() {

		// reset mission retrieval flags and temp array
		clearTimeout(mission.waypoints_request_timeout);
		mission.is_received_waypoint_count(false);

		mission.waypoints_count = 0;
		mission.waypoints_count_limit = 0;
		mission.waypoints_request_isFinished = false;

		// emit waypoints
		mission.emit(mission.EVENT_KEY_ON_MISSION_WAYPOINTS, [mission.mission_items]);

		// reset waypoints
		mission.mission_items = {};

	},

	on: function(evtKey, callback) {

		if(!mission.callbacks[evtKey]) {
			mission.callbacks[evtKey] = [];
		}

		mission.callbacks[evtKey].push(callback);
	},

	emit: function(evtKey, params) {

		if(!mission.callbacks[evtKey]) {
			return;
		}

		if(!(params instanceof Array)) {
			params = [params];
		}

		for(var i = 0; i < mission.callbacks[evtKey].length; i++) {
			mission.callbacks[evtKey][i].apply(mission, params);
		}

	}

};

module.exports = mission;