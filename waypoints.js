/**
 * Waypoint utils library
 */

var waypoints = {

	_is_changed: false,

	last_waypoint: null,
	next_waypoint: null,
	current_waypoint: null,

	// marks the waypoint to visit
	// immediately after next_waypoint
	following_waypoint: null,

	waypoints: {},

	// return waypoint by key
	get_waypoint: function(key) {
		return waypoints.waypoints[key];
	},

	get_waypoints: function() {
		return waypoints.waypoints;
	},

	get_last_waypoint: function() {
		return waypoints.last_waypoint;
	},

	get_next_waypoint: function() {
		return waypoints.next_waypoint;
	},

	get_current_waypoint: function() {
		return waypoints.current_waypoint;
	},

	get_following_waypoint: function() {
		return waypoints.following_waypoint;
	},

	/**
	 * Setting the current waypoint will also set the
	 * next, previous, and following waypoints. If the
	 * argument passed does not correspond to a waypoint
	 * that has previously been set, or if the argument
	 * modified (+1, -1) to retrieve next, previous, or
	 * following waypoints points to a waypoint that does
	 * not exist or has not yet been set, then that
	 * waypoint will be set to NULL.
	 *
	 * If the next waypoint differs from the current
	 * waypoint assigned as waypoints.next_waypoint,
	 * then waypoints._is_changed will be set to true.
	 *
	 * @param wpt_key	int	representing the hash key, or
	 * 	index of the current waypoint
	 *
	 * @return the wpt_key, or sequence index, of the
	 * waypoint being set as the current waypoint, or
	 * NULL if the current_waypoint does not exist.
	 */
	set_current_waypoint: function(wpt_key) {

		var current_waypoint = waypoints.get_waypoint(wpt_key) || null;
		var next_waypoint = waypoints.get_waypoint(wpt_key + 1) || null;
		var previous_waypoint = waypoints.get_waypoint(wpt_key - 1) || null;
		var following_waypoint = waypoints.get_waypoint(wpt_key + 2) || null;

		if((!waypoints.next_waypoint && next_waypoint)
		|| (waypoints.next_waypoint.x != next_waypoint.x || waypoints.next_waypoint.y != next_waypoint.y)) {
			waypoints._is_changed = true;
		}		

		waypoints.last_waypoint = last_waypoint;
		waypoints.next_waypoint = next_waypoint;
		waypoints.following_waypoint = following_waypoint;
		waypoints.current_waypoint = current_waypoint;

		return current_waypoint ? wpt_key : null;
	},

	/**
	 * Sets a collection of waypoints as the current
	 * mission items.
	 */
	set_waypoints: function(waypts) {
		waypoints.waypoints =  waypts;
	},

	is_changed: function(arg) {

		if(arg) {
			var previous_state = waypoints._is_changed;
			waypoints._is_changed = arg;
			return previous_state;
		}

		return waypoints._is_changed;

	}

};

module.exports = waypoints;
