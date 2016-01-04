/**
 * Mav tests
 * https://pixhawk.ethz.ch/mavlink/
 *
 * @author juanvallejo
 */

var Mavlink 		= require('mavlink');
var mavlink 		= new Mavlink(250, 1, 'v1.0', ['common', 'pixhawk']);
var socket 			= require('dgram').createSocket('udp4');
var port 			= 14551;

mavlink.on('ready', function() {
	send_mavlink('THISISATEST', '192.168.1.10');
	// create_mav_cmd();
});

function send_mavlink(text, ip) {

	mavlink.createMessage('STATUSTEXT', {
		'severity': 6,
		'text': text
	}, function(message) {

		socket.send(message.buffer, 0, message.length + 1, port, ip, function(err, bytes) {

			if(err) {
				console.log(err);
			} else{
				console.log('Message sent.');
			}
			
			socket.close();

		});
		
	});

}

function create_mav_cmd() {

	// mavlink.createMessage('MAV_CMD_NAV_WAYPOINT', {
	// 	'Param 1': 0,
	// 	'Param 2': 1,
	// 	'Param 3': 0,
	// 	'Param 4': 0,
	// 	'X': 30,
	// 	'Y': 70,
	// 	'Z': 20
	// }, function(message) {
	// 	console.log('success');
	// });

	// mavlink.createMessage('IMAGE_TRIGGER_CONTROL', {
	// 	'enable': 1
	// }, function(message) {
	// 	console.log('success');
	// });

}
