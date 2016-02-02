/**
 * Map that helps visualize obsticle location using Open Street Map as a
 * dependency for the application. Obsticle updates, and creations are
 * specified in methods, and functions.
 *
 *    **************************** CNU Imprint ******************************
 */

    //Create the Map from the Open Layers Dependency from OSM.
    map = new OpenLayers.Map("mapdiv");
    map.addLayer(new OpenLayers.Layer.OSM());

    //Zoom into the map that we use for viewing.
    var zoom = 16;

    //Create global vector layers for the obstacles and the plane.
    var vectorLayer = new OpenLayers.Layer.Vector("Overlay", {
        isBaseLayer: true,
        renderers: ['SVG', 'Canvas', 'VML']
    });
    var Obst_Layer = new OpenLayers.Layer.Vector("Overlay_Obst", {
        renderers: ['SVG', 'Canvas', 'VML']
    });
    var planeLayer = new OpenLayers.Layer.Vector("Plane", {
        renderers: ['SVG', 'Canvas', 'VML']
    });



    //Make the plane marker for the Open Layers Marker layer.
    var feature = new OpenLayers.Feature.Vector(
	new OpenLayers.Geometry.Point(-76.427991, 38.144616).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
        {description:'X-8 Plane for AUVSI SUAS Competition'} ,
        { externalGraphic: 'map_app/img/star_plane.png', 
          graphicHeight: 30, graphicWidth: 30, graphicXOffset:-12, graphicYOffset:-25 }
    );


    //Add the Plane's Icon automatically to the center of the runway.
            // vectorLayer.addFeatures(feature);
            map.addLayer(vectorLayer);
            map.addLayer(Obst_Layer);
            map.addLayer(planeLayer);



    // Where to position the map (Initially)
    var lonLat = new OpenLayers.LonLat( -76.427991,38.144616 )                     
            .transform(                                                             
                  new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984  
                  map.getProjectionObject() // to Spherical Mercator Projection       
             );
    map.setCenter (lonLat, zoom);





//queue implementation for tracer display. To avoid overload.
var queue_plane = [];

//Checker to see if the plane has moved or not.
var hasMoved = false;

/**
  * Change the location of the plane marker leaving tracer.
  * 
  * @param lon - Longitude of new waypoint
  * @param lat - Latitude of the new waypoint.
  * 
  * @return - updated plane marker.
  */
function changePlaneLoc(lon, lat) {

    if (queue_plane.length >= 100) {
        planeLayer.removeFeatures(queue_plane[0]);
        queue_plane.shift();
    }

    feature.style.externalGraphic = 'map_app/img/track_pixel.png';
    feature.style.graphicHeight = 10;
    feature.style.graphicWidth = 10;
    feature.style.graphicXOffset = -4;
    feature.style.graphicYOffset = -13;

    queue_plane.push(feature);

    var trackFeature = feature;

    feature = new OpenLayers.Feature.Vector(
        new OpenLayers.Geometry.Point(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
        {description:'X-8 Plane for AUVSI Competition'} ,
        {externalGraphic:'map_app/img/star_plane.png', graphicHeight: 30, graphicWidth: 29, graphicXOffset:-12, graphicYOffset:-25 }
    );

    UpdateLayer(null, planeLayer, [feature, trackFeature]);

    var lonLat = new OpenLayers.LonLat( lon, lat )                     
        .transform(                                                             
            new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984  
            map.getProjectionObject() // to Spherical Mercator Projection       
        );

    if(!hasMoved) {
        map.panTo(lonLat);
    }
}




/**
  * Update the plane layer so that the plane 
  * is update with the marker of previous location.
  * 
  * @param mapLayer - Open Street Map layer
  * @param featureLayer - Layer that contains Plane.
  * @param features - the tracer marker that's used.
  * 
  * @return - updated plane layer.
  */
function UpdateLayer(mapLayer, featureLayer, features) {

    //setting loaded to false unloads the layer//
    if(mapLayer) {
        mapLayer.loaded = false;
    }

    if(featureLayer) {
        featureLayer.loaded = false;
    }

    //setting visibility to true forces a reload of the layer//
    if(mapLayer) {
        mapLayer.setVisibility(true);
    }

    if(featureLayer) {
        featureLayer.setVisibility(true);
    }

    //the refresh will force it to get the new KML data//
    if(mapLayer) {
        mapLayer.refresh({ force: true, params: { 'key': Math.random()} });
    }

    if(featureLayer) {
        featureLayer.refresh({ force: true, params: { 'key': Math.random()} });
    }
    //- <3 from Thqr -//

    // draw feature if available
    if(feature && featureLayer) {
        for(var i = 0; i < features.length; i++) {
            featureLayer.addFeatures(features[i]); 
        }
    }
}

/**
  * Put a stationary obstacle marker on the map.
  * 
  * @param lon - Longitude of the obstacle.
  * @param lat - Latitude of the obstacle marker.
  * @param height - height of the cylinder
  * @param rad - radius of the cylinder
  * @return - Make obstacle marker appear on the the screen. 
  */
function createStationaryObsticle(lon, lat, height, rad) {

    obst = new OpenLayers.Feature.Vector(
		      new OpenLayers.Geometry.Point( lon, lat ).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
		      {description: 'Stationary Object'},
		      {externalGraphic:'map_app/img/cylinder_obst.png', graphicHeight: (height), graphicWidth: (rad*2), graphicXOffset:-12, graphicYOffset:-25}
					 );

    planeLayer.addFeatures(obst);
}



// Creating an array of moving obsticles
var objectObstMov = {
    Obsticles:[]
};


/**
  * Create a moving obstacle marker on the map.
  * 
  * @param lon - Longitude of the obstacle.
  * @param lat - Latitude of the obstacle marker.
  * @param id - identifufcation for input into array of moving obstacles.
  * @param size - radius of the sphere.
  * @return - Make obstacle marker appear on the the screen.
  */
function createMovingObsticle(lon, lat, id, size) {
    
    obst_mov = new OpenLayers.Feature.Vector(
		      new OpenLayers.Geometry.Point( lon, lat ).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
		      {description: id},
	     	      {externalGraphic:'map_app/img/sphere_obst.png', graphicHeight: (size*4), graphicWidth: (size*4), graphicXOffset:-12, graphicYOffset:-25}
    );

    //Creating JSON object to push to the Array
    var obst_object = {
        "Obsticle": obst_mov,
        "identification" : id,
         "obsticleLocation":[]
    };

    objectObstMov.Obsticles.push(obst_object);
    Obst_Layer.addFeatures(obst_mov);
}

// Has the stationary obstacle array been called yet?
hasBeenCalled = false; 


/**
  * Interop calls this to update obstacle positions
  * 
  * @see _JAM/views/index.html
  * @param Obstaclearr - data sent from the obstacle server contains both moving and stationary obst.
  * @return - Update the obstacle positions based on data.
  */
function arrMovObst(Obstaclearr) {
    if (!hasBeenCalled) {
        for (var i = 0; i < Obstaclearr.stationary_obstacles.length; i++) {
            createStationaryObsticle(Obstaclearr.stationary_obstacles[i].longitude, Obstaclearr.stationary_obstacles[i].latitude, Obstaclearr.stationary_obstacles[i].cylinder_height, Obstaclearr.stationary_obstacles[i].cylinder_radius);
        }

        hasBeenCalled = true;
    }
    
    wipeObstacles();

    for (var i = 0; i < Obstaclearr.moving_obstacles.length; i++) {
        createMovingObsticle(Obstaclearr.moving_obstacles[i].longitude, Obstaclearr.moving_obstacles[i].latitude, i, Obstaclearr.moving_obstacles[i].sphere_radius);
    }

}

/**
  * wipe the obstacle layer so that we can put obstacles at new positions.
  * @return - wipe everything off the layer
  */
function wipeObstacles() {
    Obst_Layer.removeAllFeatures();
}
