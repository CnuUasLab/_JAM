/**
 * HTTP Connection and browser request handler
 * Includes socket.io controller
 */

var http = require('http');
var fs = require('fs');
var io = require('socket.io');

var config = require('./config.js');

var server = {

	connection: null,

	EVENT_KEY_ON_SERVER_REQUEST: 'request',
	EVENT_KEY_ON_SERVER_ERROR: 'error',
	EVENT_KEY_ON_SERVER_CONNECTION: 'connection',

	REQUEST_API_IS_INVALID: true,

	routes: {
		'/': '/index.html',
		'/map': '/map_app/index.html'
	},

	callbacks: {},

	receive_request: function(request, response, path) {

		fs.readFile(__dirname + path, function(err, data) {

			if(err) {
				response.writeHead(404);
				return response.end('404. File not found.');
			}

			response.writeHead(200, { 'Content-Type': 'text/html' });
			response.end(data);

		});

	},

	receive_api_grid_request: function(request, response, grid) {

		server.receive_api_request(request, response);

		try {
			response.end(JSON.stringify(grid));
		} catch(e) {
			response.writeHead(500, {'Content-Type': 'text/plain'});
			response.end(e.toString());
		}

	},

	receive_api_path_request: function(request, response) {

		if(request.type.toLowerCase() != 'put') {
			return server.receive_api_request(request, response, server.REQUEST_API_IS_INVALID);
		}

		response.end('');

	},

	receive_api_request: function(request, response, is_invalid) {

		if(is_invalid) {
			response.writeHead(404, {'Content-Type': 'text/plain'});
			return response.end('Invalid endpoint.');
		}

		response.writeHead(200, {'Content-Type': 'application/json'});

	},

	get_connection: function() {
		return server.connection;
	},

	init: function() {

		server.connection = http.createServer(function(request, response) {
			var path = server.routes[request.url] || request.url;
			server.emit(server.EVENT_KEY_ON_SERVER_REQUEST, [request, response, path]);
		});

		server.connection.listen(config.get_config('http').port, config.get_config('http').host);

		server.on('error', function (e) {
			server.emit(server.EVENT_KEY_ON_SERVER_ERROR, [e]);
		});

		io.listen(server.connection).on('connection', function(client) {
			server.emit(server.EVENT_KEY_ON_SERVER_CONNECTION, [client]);
		});

	},

	on: function(evtKey, callback) {

		if(!server.callbacks[evtKey]) {
			server.callbacks[evtKey] = [];
		}

		server.callbacks[evtKey].push(callback);
	},

	emit: function(evtKey, params) {

		if(!server.callbacks[evtKey]) {
			return;
		}

		if(!(params instanceof Array)) {
			params = [params];
		}

		for(var i = 0; i < server.callbacks[evtKey].length; i++) {
			server.callbacks[evtKey][i].apply(server, params);
		}

	}

};

module.exports = server;