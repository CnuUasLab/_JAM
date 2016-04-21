# Interoperability server

##What?
Interoperability server, relays ground station telemetry to a specified host:port.
Relays mission target requests to ground station.
Displays mission obstacles, waypoints, and plane location on web-client.
Hosts web-client on [http://localhost:8000](http://localhost:8000).

Inorder to run the Interoperability server you must install node package manager dependencies.
Run: <b>`npm install`</b>

To run the Interoperability Server run: <b>`node interop.js`</b>

## Config

Dependency downlaod and config:

```
npm install
git submodule update --init
```

### Ground Station Configuration

- Run SITL or GCS with flag `--out=udpin:0.0.0.0:14552`
- Run SITL or GCS with flag `--out=<ip_of_machine_running_this_server>:14551`

#### Alternatively, if already running GCS software:

- Run on MAVProxy `output add udpin:0.0.0.0:14552`
- Run on MAVProxy `output add <ip_of_machine_running_this_server>:14551`

Note that ports used above with `:number` are default values set in `config.js`.

### Map Configuration

```
cd map_app
./tile_download.sh
```

The map runs on an openlayers submodule in `/views/index.html`