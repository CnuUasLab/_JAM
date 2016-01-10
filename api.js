/**
 * API endpoint response handlers
 */

var libmath = require('./libmath.js');
var grid 	= require('./grid.js');
var config 	= require('./config.js');

var api = {

	/* Get current grid information for DROPS.
	 *
	 * @param waypoints 	Object 	structure of waypoint data
	 * @return JSON: data that provides X and Y parameters for the Search area.
	 */
	get_grid_details: function(telemetry, waypoints) {

		var prevWaypoint = waypoints.get_last_waypoint();
		var nextWaypoint = waypoints.get_next_waypoint()
		var followingWaypoint = waypoints.get_following_waypoint();

		grid.set_width(config.get_config('grid').grid_with);

		// calculate distance from last waypoint to next
		// waypoint padding also added to grid begin / end
		if(prevWaypoint && nextWaypoint) {
			
			grid.set_height(
				grid.set_goal_lon(libmath.get_distance(prevWaypoint, nextWaypoint) 
					+ (config.get_config('grid').grid_padding_height)
				)
			);
			
			grid.get_grid().grid_height += (config.get_config('grid').grid_padding_height);

			grid.set_goal_lat(config.get_config('grid').grid_with / 2);

		}

		if(followingWaypoint) {

			var theta_wptLast_wptNext = libmath.get_bearing(prevWaypoint, nextWaypoint);
			var theta_wptNext_wptFollowing = libmath.get_bearing(nextWaypoint, followingWaypoint);

			grid.set_goal_theta(theta_wptNext_wptFollowing - theta_wptLast_wptNext);
		}

		// calculate plane location
		var location = libmath.get_distance_from_path(telemetry.get_coords(), prevWaypoint, nextWaypoint);
		var theta = telemetry.get_heading() - libmath.get_bearing(prevWaypoint, followingWaypoint);

		if(theta < 360) {
			theta += 360;
		}

		grid.set_location_lat(location.x + (config.get_config('grid').grid_with / 2));
		grid.set_location_lon(location.y + config.get_config('grid').grid_padding_height);
		grid.set_location_theta(theta);

		return grid.get_grid();
	},

	/**
	 * @put /api/grid
	 * Get the current search grid information from the Interop server.
	 *
	 * @param followingWaypoint 	Object 	the waypoint after the nextWaypoint
	 * @return JSON: data that provides X and Y parameters for the Search area.
	 */
	put_path: function() {
		// TODO
		return 0;
	}

};

module.exports = api;
