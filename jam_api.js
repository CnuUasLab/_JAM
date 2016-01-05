/**
  * The Abstract programming Interface for the _JAM use with DROPS
  *
  * @version 12/28/2015 - Function Shells.
  */

var geolib = require('./Geolib/dist/geolib.js');

var LOCATION_SCALING_FACTOR = 0.011131884502145034;
var LOCATION_SCALING_FACTOR_INV = 89.83204953368922;
var DEG_TO_RAD = 0.017453292519943295769236907684886;

var publicFunctions = {

	config: {
		grid_width: 0,
		grid_padding_height: 0
	},

	constrain_float: function(amount, low, high) {
		
		if(isNaN(amount)) {
			return (low + high) * 0.5;
		}

		return ((amount) < (low) ? (low) : ((amount) > (high) ? (high) : (amount)));

	},

	/**
	 * Location = latlon
	 */
	longitude_scale: function(waypoint) {
		
		var scale = Math.cos(waypoint.y * -0.0000001 * DEG_TO_RAD);
    	return publicFunctions.constrain_float(scale, 0.01, 1.0);
	
	},

	/**
	 * Returns distance between two vectors in meters
	 */
	get_distance: function(waypointA, waypointB) {

		waypoint1 = {};
		waypoint2 = {};

		for(var i in waypointA) {
			waypoint1[i] = waypointA[i];
		}

		for(var i in waypointB) {
			waypoint2[i] = waypointB[i];
		}

		waypoint1.x *= 10000000;
		waypoint1.y *= 10000000;

		waypoint2.x *= 10000000;
		waypoint2.y *= 10000000;

		var delta_lat = waypoint2.x - waypoint1.x;
		var delta_lon = (waypoint2.y - waypoint1.y) * publicFunctions.longitude_scale(waypoint2);

		return (Math.sqrt((delta_lat * delta_lat) + (delta_lon * delta_lon))) * LOCATION_SCALING_FACTOR;

	},

	/**
	 * Returns distance between two vectors, adjusted for different scale?
	 * x and y relative to line between two waypoints, using trignonometric functions
	 *
	 * @param waypoint1 = plane
	 * @param waypoint2 = previosu waypoint
	 * @param waypoint3 = next waypoint
	 *
	 * @return distance between waypointA and line between waypointB and waypointC
	 */
	get_distance_trig: function(waypointA, waypointB, waypointC) {

		// assume waypoint1 is origin
		// waypoint2 is middle
		// waypoint 3 is farthes point

		var theta = publicFunctions.get_angle3(waypointA, waypointB, waypointC);
		var hypothenus = publicFunctions.get_distance(waypointA, waypointB);

		return Math.sin(theta) * hypothenus;

	},

	/**
	 * Same as above, but uses dot product
	 *
	 * @param waypoint1 = plane
	 * @param waypoint2 = previosu waypoint
	 * @param waypoint3 = next waypoint
	 */
	get_distance_vector: function(waypoint1, waypoint2, waypoint3) {

		var waypoint12 = { x: waypoint2.x - waypoint1.x, y: waypoint2.y - waypoint1.y };
		var waypoint23 = { x: waypoint2.x - waypoint3.x, y: waypoint2.y - waypoint3.y };

		// convert to meters
		waypoint12.x = waypoint12.x * LOCATION_SCALING_FACTOR;
		waypoint12.y = waypoint12.y * LOCATION_SCALING_FACTOR * publicFunctions.longitude_scale(waypoint12);

		waypoint23.x = waypoint23.x * LOCATION_SCALING_FACTOR;
		waypoint23.y = waypoint23.y * LOCATION_SCALING_FACTOR * publicFunctions.longitude_scale(waypoint23);

		var cross = (waypoint12.x * waypoint23.y) - (waypoint12.y * waypoint23.x);
		var dist = publicFunctions.get_distance(waypoint2, waypoint3);

		return cross / dist;

	},

	/**
	 * Returns theta (angle in degrees) between one waypoint and another
	 */
	get_bearing: function(waypoint1, waypoint2) {

		var off_x = waypoint2.x - waypoint1.x;
		var off_y = (waypoint2.y - waypoint1.y) / longitude_scale(waypoint2);

		var bearing = 9000 + Math.atan2(-off_y, off_x) * 5729.57795;

		if(bearing < 0) {
			bearing += 36000;
		}

		return bearing / 100;

	},

	/**
	 * returns angle between two vectors in degrees
	 */
	get_angle: function(waypoint1, waypoint2, waypoint3) {

		var dot = (waypoint1.y * waypoint2.y) + (waypoint1.x * waypoint2.x);
		var det = (waypoint1.y * waypoint2.x) - (waypoint1.x * waypoint2.y);

		var angle = Math.atan2(det, dot);

		return Math.floor(angle * 180 / Math.PI +0.5);
	},

	/**
	 * returns angle between two vectors in radians,
	 * using a third vector as the reference point.
	 *
	 * @param waypoint3 point relative to waypoint3
	 */
	get_angle3: function(waypoint1, waypoint2, waypoint3) {
	
		var waypoint12 = { x: waypoint2.x - waypoint1.x, y: waypoint2.y - waypoint1.y };
		var waypoint23 = { x: waypoint2.x - waypoint3.x, y: waypoint2.y - waypoint3.y };

		var dot = (waypoint12.x * waypoint23.x) + (waypoint12.y * waypoint23.y);
		var cross = (waypoint12.x * waypoint23.y) - (waypoint12.y * waypoint23.x);
		var alpha = Math.atan2(cross, dot);

		// Math.floor(alpha * 180 / Math.PI + 0.5)
		return alpha;

	},

	/**
	 * @get /api/grid
	 * Get the current search grid information from the Interop server.
	 *
	 * @param followingWaypoint [Waypoint] the waypoint after the nextWaypoint
	 *
	 * @return JSON: data that provides X and Y parameters for the Search area.
	 */
	get_grid_details: function(currentLocation, previousWaypoint, nextWaypoint, followingWaypoint) {

		var defaultResponse = {

			"grid_width": 0, // fixed - perpendicular to y axis
			"grid_height": 0, // parallel to the previous and next waypoint (goal)
			
			// server obstacles
			"obstacles": {
				"moving_obstacles": [],
				"stationary_obstacles": []
			},

			// next waypoint
			"goal": {

				"x": 0,
				"y": 0,
				"theta": 0
			},

			// current plane location
			"location": {

				"x": 0,  // longitude -> ((lon_currLoc - lon_prevWpt) * LOCATION_SCALING_FACTOR) + publicFunctions.config.grid_padding_height;
				"y": 0, // latitude -> ((lat_currLoc - lat_prevWpt) * longitude_scale(curr_location) * LOCATION_SCALING_FACTOR) + publicFunctions.config.grid_padding_height;
				"theta": 0
			}

		};

		defaultResponse.grid_width = defaultResponse.config.grid_width;

		// calculate distance from last waypoint to next waypoint
		// padding also added to grid begin / end
		if(previousWaypoint && nextWaypoint) {
			
			defaultResponse.grid_height = defaultResponse.goal.y = publicFunctions.get_distance(previousWaypoint, nextWaypoint) + (publicFunctions.config.grid_padding_height);
			defaultResponse.grid_height += (publicFunctions.config.grid_padding_height);

			// set rest of goal's info
			defaultResponse.goal.x = publicFunctions.config.grid_width / 2;
		}

		// calculate goal theta using followingWaypoint
		if(followingWaypoint) {

			var theta_wptLast_wptNext = get_bearing(previousWaypoint, nextWaypoint);
			var theta_wptNext_wptFollowing = get_bearing(nextWaypoint, followingWaypoint);

			defaultResponse.goal.theta = theta_wptNext_wptFollowing - theta_wptLast_wptNext;
		}

		// calculate plane location


		return defaultResponse;
	},

	set_config: function(config_object) {
		publicFunctions.config = config_object;
	},

	/**
	 * @put /api/path
	 * Get the Current Path
	 */
	put_path: function() {
		return 0;
	}
};

module.exports = publicFunctions;
