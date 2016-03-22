Interoperability server
=======================

Listens for connections @ http://localhost:8080 by default.

Inorder to run the Interoperability server you must install node paackage manager dependencies.
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
To download the tiles:

   Run the following commands on a Mac OSX terminal or on a Linux command prompt:                                                      
   <b> Note you will need cURL to run this. </b>
 
`curl "http://c.tile.openstreetmap.org/18/754[05-30]/1009[70-90].png" -o "map_app/tiles/#1/754#2/1009#3.png" --create-dirs`     
`curl "http://c.tile.openstreetmap.org/17/377[00-24]/504[80-99].png" -o "map_app/tiles/17/377#1/504#2.png" --create-dirs`       
`curl "http://c.tile.openstreetmap.org/16/188[52-58]/252[42-49].png" -o "map_app/tiles/16/188#1/252#2.png" --create-dirs`       

   <i> If you are testing in SITL you need to download the tiles to view tiles in Australia </i>

`curl "http://b.tile.openstreetmap.org/16/599[10-25]/396[45-65].png" -o "map_app/tiles/16/599#1/396#2.png" --create-dirs`       
`curl "http://a.tile.openstreetmap.org/17/1198[35-55]/793[08-28].png" -o "map_app/tiles/17/1198#1/793#2.png" --create-dirs`        
`curl "http://a.tile.openstreetmap.org/18/2396[65-90]/1586[28-63].png" -o "map_app/tiles/18/2396#1/1586#2.png" --create-dirs`   
