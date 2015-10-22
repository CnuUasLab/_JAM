Map App
=======

This is the application that runs the google maps app that will display via markers the position of the plane at the patuxant naval air base.

The main application for managing the visualization of elements on the map is in `app.js`.

The code automatically puts a plane on the field in the middle of the cross roads of the tarmac at the PNAS Runway for the competition.

```javascript

changePlaneLoc(long, lat) {} //updates the plane's location with the Longitude and Latitude

UpdateLayer() {} // A function that change-based functions use to update the vector layer with a new visualized                       // location of the plane.

createStationaryObsticle(long, lat) {} // Puts a stationary obstacle as an orange Cylinder on the field.

createMovingObsticle(long, lat, id) {} // creates a new moving obsticle as a Blue Sphere, and updates it's credentials in a JSON object for extraction, and updating it's location.
