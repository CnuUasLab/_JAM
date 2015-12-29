/*
 * The Abstract programming Interface for the _JAM use with DROPS
 *
 * @version 12/28/2015 - Function Shells.
 */

/*
 * Get the current search grid information from the Interop server.
 * @return JSON: data that provides X and Y parameters for the Search area.
 */

function getGrid() {
    var obj = { x:0,
		y:0 };

    // TODO - modify obj

    return obj;
}

/*
 * Get the Obstacle information based on the current search grid.
 * @return JSON: Data of the location of the Obstacle and readings for the specs of the obstacle.
 */

function getObstacleInformation() {
    var obj = { "moving_obstacles": [],
		"stationary_obstacles": [] };
    
    // TODO - modify the obstacle 

    return obj;
}

/*
 * Get the Goal for the current call to DROPS with the Angle to that goal
 * @return JSON: X and Y axis of the Goal, as well as the Angle.
 */

function getGoal() {
    var obj = { "x":0, 
		"y":0,
		"theta":0 };

    // TODO - modify the object for the X Y and the angle axis of the goal

    return obj;
}

/*
 * Get the current location of the plane in the search grid.
 * @return JSON: the current X and Y of the plane in the search grid and the degrees from the Y axis counter-clockwise
 */

function getGoal() {
    var obj = { "x":0,
                "y":0,
                "theta":0 };

    // TODO - modify the object for the X Y and the angle axis of the goal                                                                                                                                                                    

    return obj;
}

/*
 * Get the Current Path
 */

function getPath() {
    return 0;
}