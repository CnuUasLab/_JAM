/**
 * Math and location utils library
 */

var LOCATION_SCALING_FACTOR = 0.011131884502145034;
var LOCATION_SCALING_FACTOR_INV = 89.83204953368922;
var DEG_TO_RAD = 0.017453292519943295769236907684886;

var libmath = {

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
    	return libmath.constrain_float(scale, 0.01, 1.0);
	
	},

	/**
	 * Calculates distance between two vectors (meters).
	 * Function taken from ArduPilot's "location.c" AP_Math library
	 * https://github.com/diydrones/ardupilot/blob/master/libraries/AP_Math/location.cpp 
	 * @return distance in meters
	 */
	get_distance: function(waypointA, waypointB) {

		var waypoint1 = {};
		var waypoint2 = {};

		for(var i in waypointA) {
			waypoint1[i] = waypointA[i];
		}

		for(var i in waypointB) {
			waypoint2[i] = waypointB[i];
		}

		waypoint1.x *= 1e7;
		waypoint1.y *= 1e7;

		waypoint2.x *= 1e7;
		waypoint2.y *= 1e7;

		var delta_lat = waypoint2.x - waypoint1.x;
		var delta_lon = (waypoint2.y - waypoint1.y) * libmath.longitude_scale(waypoint2);

		return (Math.sqrt(Math.pow(delta_lat, 2) + Math.pow(delta_lon, 2))) * LOCATION_SCALING_FACTOR;

	},

	/**
	 * Returns distance from waypointA to the line between waypointB and waypointC
	 * Assumes waypoints contain x (latitude) and y (longitude) properties in decimal notation.
	 *
	 * @param waypointA 	Object 	plane
	 * @param waypointB 	Object 	previosu waypoint
	 * @param waypointC 	Object 	next waypoint
	 *
	 * @return 	Object 	with properties { x: distance in meters perpendicular to path between waypointB and waypointC,
	 * 										y: distance in meters parallel to path between waypointB and waypointC }
	 */
	get_distance_from_path: function(waypointA, waypointB, waypointC) {

		var waypoint1 = {};
		var waypoint2 = {};
		var waypoint3 = {};

		for(var i in waypointA) {

			waypoint1[i] = waypointA[i];

			if(i == 'y' || i == 'x') {

				waypoint1[i] *= 1e7;

				if(i == 'y') {
					waypoint1[i] *= libmath.longitude_scale(waypoint1);
				}

				waypoint1[i] *= LOCATION_SCALING_FACTOR;

			}
		}

		for(var i in waypointB) {

			waypoint2[i] = waypointB[i];

			if(i == 'y' || i == 'x') {

				waypoint2[i] *= 1e7;

				if(i == 'y') {
					waypoint2[i] *= libmath.longitude_scale(waypoint2);
				}

				waypoint2[i] *= LOCATION_SCALING_FACTOR;

			}
		}

		for(var i in waypointC) {

			waypoint3[i] = waypointC[i];

			if(i == 'y' || i == 'x') {

				waypoint3[i] *= 1e7;

				if(i == 'y') {
					waypoint3[i] *= libmath.longitude_scale(waypoint3);
				}

				waypoint3[i] *= LOCATION_SCALING_FACTOR;

			}
		}

		var waypoint12 = { x: waypoint2.x - waypoint1.x, y: waypoint2.y - waypoint1.y };
		var waypoint23 = { x: waypoint2.x - waypoint3.x, y: waypoint2.y - waypoint3.y };

		var dot = (waypoint12.x * waypoint23.x) + (waypoint12.y * waypoint23.y);
		var cross = (waypoint12.x * waypoint23.y) - (waypoint12.y * waypoint23.x);
		var dist = Math.sqrt(Math.pow(waypoint3.x - waypoint2.x, 2) + Math.pow(waypoint3.y - waypoint2.y, 2));

		return {
			x: cross / dist,
			y: dot / dist
		}

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

	}

};

module.exports = libmath;
