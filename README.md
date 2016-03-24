Interoperability server
=======================

Listens for connections @ http://localhost:8080 by default.

Inorder to run the Interoperability server you must install node package manager dependencies.
Run: <b>`npm install`</b>

To run the Interoperability Server run: <b>`node interop.js`</b>

# SITL Config

Add `--out=udpin:0.0.0.0:<port>` to send MISSION_ITEMS

# Map Configuration

OpenLayers 2 Configuration
--------------------------
The map runs on an openlayers submodule in `views/index.html`
To start redirect to the root direcotry of the repository and run `git submodule init`
You should see something about git@openlayers/ol2.git show.
Then run `git submodule update` the tools should clone into the ol2 directory in the root of the repository.

Tile Configuration & Download
-----------------------------
Since we have to access tiles locally on the flight field the map application will be using tiles that we download into the tiles folder on the internet.
To download the tiles run the tile download script in the root of the repository. `./tile_download.sh`