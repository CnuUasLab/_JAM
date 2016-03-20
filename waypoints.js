/**
 * Waypoint utils library
 */

var waypoints = {

	_is_changed: false,

	last_waypoint: null,
	next_waypoint: null,
	current_waypoint: null,

	_waypoint_count: 0,

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
	
	get_waypoint_count: function() {
		return waypoints._waypoint_count;
	},

	/**
	 * Setting the current waypoint will also set the
	 * next, previous, and next waypoints. If the
	 * argument passed does not correspond to a waypoint
	 * that has previously been set, or if the argument
	 * modified (+1, -1) to retrieve next, previous, or
	 * next waypoints points to a waypoint that does
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
	set_current_waypoint: function(mavl, wpt_key) {

		if(waypoints.get_current_waypoint() && (wpt_key == waypoints.get_current_waypoint().seq)) {
			return;
		}

		// assumes we are following waypoints in order
		var previous_waypoint = waypoints.get_current_waypoint();
		var current_waypoint = waypoints.get_waypoint(waypoints.get_next_nav_cmd(mavl, wpt_key));
		var next_waypoint = current_waypoint ? waypoints.get_waypoint(waypoints.get_next_nav_cmd(mavl, current_waypoint.seq + 1)) : null;

		if(previous_waypoint && current_waypoint && next_waypoint) {
			console.log('INFO WAYPOINTS waypoint #' + wpt_key + ' reached (prev, current, next waypoints are now defined).');
		}

		if((previous_waypoint && waypoints.get_last_waypoint() && waypoints.get_last_waypoint().seq != previous_waypoint.seq) 
			|| (current_waypoint && waypoints.get_current_waypoint() && waypoints.get_current_waypoint().seq != current_waypoint.seq)
			|| (next_waypoint && waypoints.get_next_waypoint() && waypoints.get_next_waypoint().seq != next_waypoint.seq)) {
			waypoints._is_changed = true;
		}

		waypoints.last_waypoint = previous_waypoint;
		waypoints.current_waypoint = current_waypoint;
		waypoints.next_waypoint = next_waypoint;

		return current_waypoint ? current_waypoint.seq : null;
	},

	/**
	 * Determines if wpt_key corresponds
	 * to a navigation instruction, such as jpm
	 */
	is_nav_cmd: function(mavl, wpt_key) {
		return waypoints.get_waypoint(wpt_key).command <= mavl.get_mav_const('MAV_CMD', 'MAV_CMD_NAV_LAST');
	},

	/**
	 * From a "current" waypoint id passed, the next
	 * non special waypoint nav command wpt_key is returned.
	 * if no other normal nav waypoint cmds are not found,
	 * null is returned.
	 */
	get_next_nav_cmd: function(mavl, wpt_key) {

		var current_wpt_key = wpt_key;

		while(current_wpt_key < waypoints.get_waypoint_count()) {
			
			current_wpt_key = waypoints.get_next_cmd(mavl, current_wpt_key)
			
			if(!current_wpt_key) {
				return null;
			}

			if(waypoints.is_nav_cmd(mavl, current_wpt_key)) {
				return current_wpt_key;
			}

			current_wpt_key++;
		}

		return current_wpt_key;
	},

	/**
	 * Assumes intent is to always follow jumps in nav cmd list
	 */
	get_next_cmd: function(mavl, wpt_key) {

		var current_wpt_key = wpt_key;
		var current_wpt = null;
		var max_loops = 64; // mage nums ftw
		var wpt_jump_key = -1;

		while(current_wpt_key < waypoints.get_waypoint_count()) {

			current_wpt = waypoints.get_waypoint(current_wpt_key);
			if(current_wpt.command == mavl.get_mav_const('MAV_CMD', 'MAV_CMD_DO_JUMP')) {
				
				if(max_loops-- == 0) {
					return null;
				}
				
				if(current_wpt.param1 >= waypoints.get_waypoint_count() || current_wpt.param1 == 0) {
					return null;
				}

				if(wpt_jump_key == current_wpt_key) {
					return null;
				}

				if(wpt_jump_key == -1) {
					wpt_jump_key = current_wpt_key;
				}

				current_wpt_key = current_wpt.param1;
				console.log('WAYPOINTS NEXT_CMD taking jump to waypoint #' + waypoints.get_waypoint(current_wpt_key).seq);

			} else {
				return current_wpt_key;
			}
		}

		return null;

	},

	/**
	 * Sets a received collection of MISSION_ITEM
	 * as the current waypoints.
	 */
	set_waypoints: function(waypts) {
		waypoints.waypoints =  waypts;
		waypoints._waypoint_count = Object.keys(waypts).length;
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
