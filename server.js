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
		'/': '/views/index.html',
		'/map': '/views/index.html'
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

	/**
	 * Relay target requests to auvsi server
	 */
	receive_api_target_request: function(request, response, auvsi) {

		console.log('RELAY SERVER FUNC(receive_api_target_request) Relaying api target request');
		server.receive_api_request(request, response);

		if(request.method == 'POST') {
			return server.handle_post_request(request, function(err, data) {

				if(err) {
					console.log('ERR RELAY SERVER FUNC(handle_post_request) ' + err);
					response.writeHead(500);
					return response.end(err);
				}

				auvsi.post(request.url, data, function(res_err, res_data) {

					if(res_err) {
						console.log('ERR RELAY SERVER FUNC(receive_api_target_request) ' + res_err);
						response.writeHead(500);
						return response.end(res_err);
					}

					console.log('RELAY SERVER FUNC(receive_api_target_request) Successfully relayed api target request');
					response.end(res_data);

				});
			});
		}

		if(request.method == 'GET') {
			auvsi.get(request.url, function(err, data) {

				if(err) {
					console.log('ERR RELAY SERVER FUNC(handle_post_request) ' + err);
					response.writeHead(500);
					return response.end(err);
				}

				console.log('RELAY SERVER FUNC(receive_api_target_request) Successfully relayed api target request');
				response.end(data);

			});
		}

		if(request.method == 'PUT') {
			
		}

		if(request.method == 'DELETE') {
			
		}

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

	handle_post_request: function(request, callback) {

		callback = callback || function() {};

		var data = '';
		request.on('data', function(chunk) {
			data += chunk;
		});
		request.on('end', function() {
			callback.call(server, null, data);
		});
		request.on('error', function(err) {
			callback.call(server, err);
		});

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