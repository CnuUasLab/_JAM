/**
 * API endpoint response handlers
 */

var libmath = require('./libmath.js');

var api = {

	/* Get current grid information for DROPS.
	 *
	 * @param followingWaypoint 	Waypoint / Object 	the waypoint after the nextWaypoint
	 * @return JSON: data that provides X and Y parameters for the Search area.
	 */
	get_grid_details: function(planeTelemetry, previousWaypoint, nextWaypoint, followingWaypoint) {

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

				"x": 0,
				"y": 0,
				"theta": 0
			}

		};

		defaultResponse.grid_width = defaultResponse.config.grid_width;

		// calculate distance from last waypoint to next waypoint
		// padding also added to grid begin / end
		if(previousWaypoint && nextWaypoint) {
			
			defaultResponse.grid_height = defaultResponse.goal.y = libmath.get_distance(previousWaypoint, nextWaypoint) 
			+ (libmath.config.grid_padding_height);
			
			defaultResponse.grid_height += (libmath.config.grid_padding_height);

			// set rest of goal's info
			defaultResponse.goal.x = libmath.config.grid_width / 2;
		}

		// calculate goal theta using followingWaypoint
		if(followingWaypoint) {

			var theta_wptLast_wptNext = libmath.get_bearing(previousWaypoint, nextWaypoint);
			var theta_wptNext_wptFollowing = libmath.get_bearing(nextWaypoint, followingWaypoint);

			defaultResponse.goal.theta = theta_wptNext_wptFollowing - theta_wptLast_wptNext;
		}

		// calculate plane location
		var location = libmath.get_distance_from_path(planeTelemetry, previousWaypoint, nextWaypoint);
		var theta = planeTelemetry.uas_heading - libmath.get_bearing(previousWaypoint, followingWaypoint);

		if(theta < 360) {
			theta += 360;
		}

		defaultResponse.location.x = location.x + (libmath.config.grid_width / 2);
		defaultResponse.location.y = location.y + libmath.config.grid_padding_height;
		defaultResponse.location.theta = theta;

		return defaultResponse;
	},

	/**
	 * @put /api/grid
	 * Get the current search grid information from the Interop server.
	 *
	 * @param followingWaypoint 	Object 	the waypoint after the nextWaypoint
	 * @return JSON: data that provides X and Y parameters for the Search area.
	 */
	put_path: function() {
		return 0;
	},

	/**
	 * Load libmath config object
	 */
	set_config: function(config) {
		libmath.set_config(config);
	}

};

module.exports = api;
