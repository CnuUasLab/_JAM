/**
 * Plane telemetry library and utilities
 */

var telemetry = {

	latitude: '0',
	longitude: '0',
	altitude_msl: '0',
	uas_heading: '0',

	get_telemetry: function() {
		return {
			x: parseInt(telemetry.latitude);
			y: parseInt(telemetry.longitude);
			altitude_msl: parseInt(telemetry.altitude_msl);
			uas_heading: parseInt(telemetry.uas_heading);
		}
	}
};

module.exports = telemetry;
