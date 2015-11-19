/**
 * Map that helps visualize obsticle location using Open Street Map as a
 * dependency for the application. Obsticle updates, and creations are
 * specified in methods, and functions.
 *
 *
 * @author davidkroell
 * @version 11/14/2015
 *
 */

map = new OpenLayers.Map("mapdiv");
map.addLayer(new OpenLayers.Layer.OSM());


    var zoom=17;

    //The vector layer
    var vectorLayer = new OpenLayers.Layer.Vector("Overlay");
    var Obst_Layer = new OpenLayers.Layer.Vector("Overlay_Obst");



    //Make the feature a plain OpenLayers marker
    var feature = new OpenLayers.Feature.Vector(
	new OpenLayers.Geometry.Point(-76.427991, 38.144616).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
        {description:'X-8 Plane for AUVSI SUAS Competition'} ,
        { externalGraphic: 'map_app/img/star_plane.png', 
          graphicHeight: 30, graphicWidth: 30, graphicXOffset:-12, graphicYOffset:-25 }
    );


    //Add the Plane's Icon automatically to the center of the runway.
            vectorLayer.addFeatures(feature);
            map.addLayer(vectorLayer);
            map.addLayer(Obst_Layer);



// Where to position the map.
var lonLat = new OpenLayers.LonLat( -76.427991,38.144616 )                     
            .transform(                                                             
                  new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984  
                  map.getProjectionObject() // to Spherical Mercator Projection       
             );
map.setCenter (lonLat, zoom);





//queue implementation for tracer display. To avoid overload.
var queue_plane = [];




//US Naval Electronic systems center  LonLat: (-76.427991, 38.144616)
function changePlaneLoc(lon, lat) {

    if (queue_plane.length >= 100) {
        vectorLayer.removeFeatures(queue_plane[0]);
        queue_plane.shift();
    }

    feature.style.externalGraphic = 'map_app/img/track_pixel.png';
    feature.style.graphicHeight = 10;
    feature.style.graphicWidth = 10;
    feature.style.graphicXOffset = -4;
    feature.style.graphicYOffset = -13;

    vectorLayer.addFeatures(feature);
    queue_plane.push(feature);

    feature = new OpenLayers.Feature.Vector(
        new OpenLayers.Geometry.Point(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
        {description:'X-8 Plane for AUVSI Competition'} ,
        {externalGraphic:'map_app/img/star_plane.png', graphicHeight: 30, graphicWidth: 29, graphicXOffset:-12, graphicYOffset:-25 }
    );
    vectorLayer.addFeatures(feature);
    UpdateLayer(vectorLayer);

    var lonLat = new OpenLayers.LonLat( lon, lat )                     
        .transform(                                                             
            new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984  
            map.getProjectionObject() // to Spherical Mercator Projection       
        );

    map.panTo(lonLat);
}




// function to automatically update the lay maps when a marker changes position.
function UpdateLayer(layer) {
    //setting loaded to false unloads the layer//
    layer.loaded = false;
    //setting visibility to true forces a reload of the layer//
    layer.setVisibility(true);
    //the refresh will force it to get the new KML data//
    layer.refresh({ force: true, params: { 'key': Math.random()} });
    //- <3 from Thqr -//
}

// This creates an Object which will appear on the map.
function createStationaryObsticle(lon, lat) {
    obst = new OpenLayers.Feature.Vector(
		      new OpenLayers.Geometry.Point( lon, lat ).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
		      {description: 'Stationary Object'},
		      {externalGraphic:'map_app/img/cylinder_obst.png', graphicHeight: 30, graphicWidth: 30, graphicXOffset:-12, graphicYOffset:-25}
					 );
    vectorLayer.addFeatures(obst);
}



//Creating an array of moving obsticles
var objectObstMov = {
    Obsticles:[]
};


// Creates a Moving obsticle on the map
function createMovingObsticle(long, lat, id) {
    
    //console.log("CREATE MOVING OBSTICLE");
    obst_mov = new OpenLayers.Feature.Vector(
		      new OpenLayers.Geometry.Point( lon, lat ).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
		      {description: id},
	     	      {externalGraphic:'map_app/img/sphere_obst.png', graphicHeight: 30, graphicWidth: 30, graphicXOffset:-12, graphicYOffset:-25}
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


//function to change the location of a moving obsticle which has already been created.

function changeMovingObsticleLoc(long, lat, id) {

    // console.log("CHANGE MOVING OBSTICLE LOCATION CALLED");
    var curr;
    var isContained = false;
    for (var i = 0; i < objectObstMov.Obsticles.length; i++) {
	if (objectObstMov.Obsticles[i].identification == id) {
	isContained = true;
	
        objectObstMov.Obsticles[i].Obsticle.style.externalGraphic = 'map_app/img/track_pixel_obst.png';
        objectObstMov.Obsticles[i].Obsticle.style.graphicHeight = 10;
        objectObstMov.Obsticles[i].Obsticle.style.graphicWidth = 10;
        objectObstMov.Obsticles[i].Obsticle.style.graphicXOffset = -4;
        objectObstMov.Obsticles[i].Obsticle.style.graphicYOffest = -10;
        
        objectObstMov.Obsticles[i].obsticleLocation.push(objectObstMov.Obsticles[i].Obsticle);
        Obst_Layer.addFeatures(objectObstMov.Obsticles[i].Obsticle);

	    curr = new OpenLayers.Feature.Vector(
		    new OpenLayers.Geometry.Point(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
 		    {description: id} ,
		    {externalGraphic:'map_app/img/sphere_obst.png', graphicHeight: 30, graphicWidth: 30, graphicXOffset:-12, graphicYOffset:-25 }
		    );

        objectObstMov.Obsticles[i].Obsticle = curr;
	    Obst_Layer.addFeatures(curr);
	    UpdateLayer(Obst_Layer);
    }
    if (isContained) {
    	while (objectObstMov.Obsticles[i].obsticleLocation.length >= 45) {
        	Obst_Layer.removeFeatures(objectObstMov.Obsticles[i].obsticleLocation[0]);
        	objectObstMov.Obsticles[i].obsticleLocation.shift();
    	}
    } else {
    	createMovingObsticle(lon, lat, id);
    }
  }
}

//set up the stationary obstacles
function arrStatObst(Obstaclearr) {
    for (var i = 0; i < Obstaclearr.stationary_obstacles.length; i++) {
        createStationaryObsticle(Obstaclearr.stationary_obstacles[i].longitude, Obstaclearr.stationary_obstacles[i].latitude);
    }
}

//display and wipe the moving obstacles
function arrMovObst(Obstaclearr) {
    wipeObstacleLayer();
    for (var i = 0; i < Obstaclearr.moving_obstacles.length; i++) {
        createMovingObsticle(Obstaclearr.moving_obstacles.length[i].longitude, Obstaclearr.moving_obstacles[i].latitude, i);
    }
}

function wipeObstacleLayer() {
    Obst_Layer.removeAllFeatures();
}
