var Mavlink = require('mavlink');
var net = require('net');
 
var mavlJSON = {
    callbacks:{},
    consts: [],
    tcp_client: null,
    tcp_server: null,

    get_tcp_server: function() {
	return this.tcp_server;
    },
    
    get_tcp_client: function() {
	return this.tcp_client;
    },

    get_mav_const_helper: function(enum_name, const_name) {
	
	
	try {
	    console.log('INFO Mavlink Constant Name : ', const_name);

	    if(!mavlJSON.consts[const_name]) {
		mavlJSON.consts[const_name] = new Mavlink(0, 0).enums.filter(function(item) {
		    return item.$.name == enum_name;
		})[0].entry.filter(function(item) {
		    return item.$.name == const_name;
		})[0].$.value;
		return mavlJSON.consts[const_name];
	    }

	    return mavlJSON.consts[const_name];
	}

	catch(e) {
	    console.log('EXCEPTION MAV_CONST_NAME', '"' + const_name + '"',
			'is not defined in the mavlink incomsing library. \
Returning hardcoded value.');

	    if(const_name == 'MAV_CMD_DO_JUMP') {
		return 177;
	    }

	    return 95;
	}


    },

    init: function(callback) {
	if(typeof callback != 'function') {
	    callback = function() {};
	}

	callback.call(mavlJSON);
	
	var server = net.createServer(function(socket) {
		socket.write('Echo server\r\n');
		socket.pipe(socket);
	    });

	server.listen(8010, '0.0.0.0');
	
	this.tcp_server = server;
	/*

	var client = new net.Socket();
	client.connect(8001, '127.0.0.1', function() {
		console.log('Mavlink TCP Connected');
		client.write('Hello, server! Love, Client.');
	});

         */

	server.on('data', function(data) {
	      console.log("Getting JSON Data");
	      mavlJSON.handleJSON(data);

	});
	
	mavlJSON.emit('ready', []);
	mavlJSON.emit('ready', []);
    },
    
    on: function(event_key, callback) {
	if(!mavlJSON.callbacks[event_key]) {
	    mavlJSON.callbacks[event_key] = [];
	}

	mavlJSON.callbacks[event_key].push(callback);
    },
    
    emit: function(event_key, data_array) {
	if(!mavlJSON.callbacks[event_key]) return;
	if(!(data_array instanceof Array)) data_array = [data_array];
	
	for (var i = 0; i < mavlJSON.callbacks[event_key].length; i++) {
	    mavlJSON.callbacks[event_key][i].apply(this, data_array);
	}
    },
    
    createMessage: function(messageType, messageBody, callback) {
	
	if(typeof callback != 'function') {
	    callback = function() {};
	}
	
	var message = {
	    mavpackettype: messageType
	}

	for(var prop in messageBody) {
	    message[prop] = messageBody[prop];
	}

	callback.call(message);

    },

    /**
     * data is JSON data of MavL
     */
    handleJSON: function(data) {
	console.log("Data Receieved from python script.");
	
	try {
	    JSON.stringify(data);
	    console.log('Data recieved is JSON');
	    mavlJSON.emit(data.mavpackettype, [data,data]);
	    mavlJSON.emit("message", data);
	}
	catch(e) {
	    console.log("Data recieved is not JSON.");
	}
    }
}

module.exports = mavlJSON;