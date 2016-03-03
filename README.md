Interoperability server
=======================

Listens for connections @ http://localhost:8080 by default.

Inorder to run the Interoperability server you must install node paackage manager dependencies.
Run: <b>`npm install`</b>

To run the Interoperability Server run: <b>`node interop.js`</b>

# SITL Config

Add `--out=udpin:0.0.0.0:<port>` to send MISSION_ITEMS

# Map Configuration

The map runs on an openlayers submodule in `views/index.html`
To start redirect to the root direcotry of the repository and run `git submodule init`
You should see something about git@openlayers/ol2.git show.
Then run `git submodule update` the tools should clone into the ol2 direcotry in the root of the repository.
