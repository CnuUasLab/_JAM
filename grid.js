/**
 * Representation of grid properties and current state
 */

var grid = {

	is_changed: false,

	// fixed - perpendicular to y axis
	grid_width: 0, 

	// parallel to the previous and next waypoint (goal)
	grid_height: 0,
	
	// server obstacles
	obstacles: {
		moving_obstacles: [],
		stationary_obstacles: []
	},

	// next waypoint
	goal: {

		x: 0,
		y: 0,
		theta: 0
	},

	// current plane location
	location: {

		x: 0,
		y: 0,
		theta: 0

	}

};

/**
 * Public methods for setting and obtaining grid object values
 */
var grid_methods = {

	set_moving_obstacles: function(obstacles) {
		grid.obstacles.moving_obstacles = obstacles;
	},

	/**
	 * Setting a single stationary obstacle with  differing parameters
	 * to a correspoding one previosuly set, or shortening the obstacle list,
	 * or enlarging it, causes grid "is_changed" flag to be true.
	 */
	set_stationary_obstacles: function(obstacles) {

		if(obstacles.length != grid.obstacles.stationary_obstacles.length) {
			grid.is_changed = true;
		} else {

			// assumes obstacle array lengths match
			for(var i = 0; i < obstacles.length; i++) {
				if(obstacles[i].is_changed) {
					grid.is_changed = true;
					break;
				}
			}

		}

		grid.obstacles.stationary_obstacles = obstacles;
	},

	set_height: function(height) {

		if(height != grid.grid_height) {
			grid.is_changed = true;
		}

		grid.grid_height = height;

	},

	set_width: function(width) {

		if(width != grid.grid_width) {
			grid.is_changed = true;
		}

		grid.grid_width = width;

	},

	/**
	 * Sets current plane's location as waypoint
	 * consisting of latitude (x), longitude (y),
	 * and theta properties.
	 *
	 * @param waypoint 	Object 	{ x: float, y: float, theta: float }
	 *
	 * @return waypoint set as new location
	 * @throws INVALID_GRID_LOCATION exception
	 */
	set_location: function(waypoint) {

		if(!(typeof waypoint == 'object') 
		|| waypoint.x == undefined || waypoint.y == undefined
		|| waypoint.theta == undefined) {
			throw "INVALID_GRID_LOCATION";
		}

		grid.location = waypoint;
	},

	/**
	 * Sets the longitudinal coordinate
	 * of the plane's current waypoint
	 *
	 * @param value 	float 	value to be set
	 *
	 * @return new value to be set as longitude
	 */
	set_location_lon: function(value) {

		grid.location.y = value;
		return value;

	},

	/**
	 * Sets the latitudinal coordinate
	 * of the plane's current waypoint
	 *
	 * @param value 	float 	value to be set
	 *
	 * @return new value to be set as latitude
	 */
	set_location_lat: function(value) {

		grid.location.x = value;
		return value;

	},

	/**
	 * Theta is the current heading of the plane 
	 * measured in degrees from the positive Y 
	 * axis of the grid counter-clockwise.
	 *
	 * @param value 	float 	value to be set
	 *
	 * @return new value to be set as longitude
	 */
	set_location_theta: function(value) {
		grid.location.theta = value;
		return value;
	},

	/**
	 * Sets current plane's goal as waypoint
	 * consisting of latitude (x), longitude (y),
	 * and theta properties.
	 *
	 * @param waypoint 	Object 	{ x: float, y: float, theta: float }
	 *
	 * @return waypoint set as new goal
	 * @throws INVALID_GRID_GOAL exception
	 */
	set_goal: function(waypoint) {

		if(!(typeof waypoint == 'object') 
		|| waypoint.x == undefined || waypoint.y == undefined
		|| waypoint.theta == undefined) {
			throw "INVALID_GRID_GOAL";
		}

		grid.goal = waypoint;
	},

	/**
	 * Sets the longitudinal coordinate
	 * of the plane's next waypoint
	 *
	 * @param value 	float 	value to be set
	 *
	 * @return new value to be set as longitude
	 */
	set_goal_lon: function(value) {

		grid.goal.y = value;
		return value;

	},

	/**
	 * Sets the latitudinal coordinate
	 * of the plane's next waypoint
	 *
	 * @param value 	float 	value to be set
	 *
	 * @return new value to be set as latitude
	 */
	set_goal_lat: function(value) {

		grid.goal.x = value;
		return value;

	},

	/**
	 * Theta is half the angle in the middle of the path from
	 * the last waypoint to the waypoint after the goal. It is
	 * measured relative to the positive Y axis cntr-clockwise.
	 *
	 * @param value 	float 	value to be set
	 *
	 * @return new value to be set as longitude
	 */
	set_goal_theta: function(value) {
		grid.goal.theta = value;
		return value;
	},

	get_grid: function() {
		return grid;
	},

	get_goal: function() {
		return grid.goal;
	},

	get_goal_lon: function() {
		return grid.goal.y;
	},

	get_goal_lat: function() {
		return grid.goal.x;
	},

	get_goal_theta: function() {
		return grid.goal.theta;
	},

	/**
	 * is_changed is computed when this method is called
	 * by determining if the waypoints object has had its
	 * "_is_changed" flag set from false to true. If true,
	 * is_changed will set the grid's "is_changed" flag to
	 * true before taking into account any argument passed
	 * to this method, or the grid's previous state.
	 *
	 * @return grid's state (previous state if boolean 
	 * 	argument is passed)
	 */
	is_changed: function(arg) {

		if(waypoints.is_changed()) {
			grid.is_changed = true;
		}

		if(arg) {
			var previous_state = grid.is_changed;
			grid.is_changed = arg;
			return previous_state;
		}

		return grid.is_changed;

	}

}

module.exports = grid_methods;
