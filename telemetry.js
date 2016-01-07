/**
 * Plane telemetry library and utilities
 */

var telemetry = {

	latitude: 0,
	longitude: 0,
	altitude_msl: 0,
	uas_heading: 0,

	get_lat: function() {
		return telemetry.latitude;
	},

	get_lon: function() {
		return telemetry.longitude;
	},

	get_alt_msl: function() {
		return telemetry.altitude_msl;
	},

	get_heading: function() {
		return telemetry.uas_heading;
	},

	get_coords: function() {
		return {
			x: telemetry.latitude,
			y: telemetry.longitude
		}
	},

	set_lat: function(value) {
		telemetry.latitude = value;
	},

	set_lon: function(value) {
		telemetry.longitude = value;
	},

	set_alt_msl: function(value) {
		telemetry.altitude_msl = value;
	},

	set_heading: function(value) {
		telemetry.uas_heading = value;
	}

};

module.exports = telemetry;
