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
		var currentWaypoint = waypoints.get_current_waypoint();
		var nextWaypoint = waypoints.get_next_waypoint();

		if(!prevWaypoint || !currentWaypoint || !nextWaypoint) {

			console.log('WARN API', 'No waypoints available ( prev curr nxt ) \
				-> (', prevWaypoint, currentWaypoint, nextWaypoint, '), \
				sending sample waypoint data...');
			return {
				"grid_width": 100,
				"grid_height": 400,
				"is_changed": false,
				"obstacles": {
					"moving_obstacles": [
						{
							"x": 50,
							"y": 200,
							"radius": 10,
							"heading": 0,
							"velocity": 5,
							"is_changed": false
						}
					],
					"stationary_obstacles": [
						{
							"x": 30,
							"y": 20,
							"radius": 15
						}
					]
				},
				"goal": {
					"x": 50,
					"y": 350,
					"theta": 15
				},
				"location": {
					"x": 50,
					"y": 5,
					"theta": 350
				}
			};

		}

		console.log('API', 'Sending live waypoint data...');
		grid.set_width(config.get_config('grid').grid_width);

		// calculate distance from last waypoint to current
		// waypoint padding also added to grid begin / end
		if(prevWaypoint && currentWaypoint) {
			
			grid.set_height(
				grid.set_goal_lon(libmath.get_distance(prevWaypoint, currentWaypoint) 
					+ (config.get_config('grid').grid_padding_height)
				)
			);
			
			grid.get_grid().grid_height += (config.get_config('grid').grid_padding_height);

			grid.set_goal_lat(config.get_config('grid').grid_width / 2);

		}

		if(nextWaypoint) {

			var theta_wptLast_wptCurr = libmath.get_bearing(prevWaypoint, currentWaypoint);
			var theta_wptCurr_wptNext = libmath.get_bearing(currentWaypoint, nextWaypoint);

			grid.set_goal_theta(theta_wptCurr_wptNext - theta_wptLast_wptCurr);
		}

		// calculate plane location
		var location = libmath.get_distance_from_path(telemetry.get_coords(), prevWaypoint, currentWaypoint);
		var theta = telemetry.get_heading() - libmath.get_bearing(prevWaypoint, currentWaypoint);

		if(theta < 360) {
			theta += 360;
		}

		grid.set_location_lat(location.x + (config.get_config('grid').grid_width / 2));
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
