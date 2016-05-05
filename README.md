# Interoperability server

##What?
Interoperability server, relays ground station telemetry to a specified host:port.
Relays mission target requests to ground station.
Displays mission obstacles, waypoints, and plane location on web-client.

## Config

Dependency downlaod and config:

```
npm install
git submodule update --init
```

### Ground Station Configuration

These steps assume you already have GCS software running with a `MAVPxory` console open. Run the following steps on the MAVProxy console:

```
mode auto
arm throttle
output add udpin:0.0.0.0:14552
output add <ip_of_machine_running_this_server>:14551
```

Note that ports used above with `:number` are default values set in `config.js`.

### Map Configuration

```
cd map_app
./tile_download
```

The map runs on an openlayers submodule in `/views/index.html`. The `tile_download` script downloads map tiles for offline use.

### Server Configuration

- All interop config settings can and should be saved in `config.js`

## Running

The web-client can be accessed at:
- [http://localhost:8000](http://localhost:8000)
- 

![alt tag](https://i.imgur.com/u02tEdv.jpg)
