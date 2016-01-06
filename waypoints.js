/**
 * Waypoint utils library
 */

var waypoints = {

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

	set_last_waypoint: function(waypoint) {
		waypoints.last_waypoint = waypoint;
	},

	set_next_waypoint: function(waypoint) {
		waypoints.next_waypoint = waypoint;
	},

	set_current_waypoint: function(waypoint) {
		waypoints.current_waypoint = waypoint;
	},

	set_following_waypoint: function(waypoint) {
		waypoints.following_waypoint = waypoint;
	},

	set_waypoints: function(waypts) {
		waypoints.waypoints =  waypts;
	}

};

module.exports = waypoints;
