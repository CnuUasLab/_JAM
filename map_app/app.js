/**
 * Map that helps visualize obsticle location using Open Street Map as a
 * dependency for the application. Obsticle updates, and creations are
 * specified in methods, and functions.
 *
 *
 * @author dkroell
 * @version 10/26/2015
 *
 */

map = new OpenLayers.Map("mapdiv");
map.addLayer(new OpenLayers.Layer.OSM());


    var zoom=17;

    //The vector layer
    var vectorLayer = new OpenLayers.Layer.Vector("Overlay");




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

    if (queue_plane.length >= 45) {
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
function createStationaryObsticle(long, lat) {
    obst = new OpenLayers.Feature.Vector(
		      new OpenLayers.Geometry.Point( long, lat ).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
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
    console.log("CREATE MOVING OBSTICLE");
    obst_mov = new OpenLayers.Feature.Vector(
		      new OpenLayers.Geometry.Point( long, lat ).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
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
    vectorLayer.addFeatures(obst_mov);
}


//function to change the location of a moving obsticle which has already been created.
function changeMovingObsticleLoc(long, lat, id) {
    console.log("CHANGE MOVING OBSTICLE LOCATION CALLED");
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
        vectorLayer.addFeatures(objectObstMov.Obsticles[i].Obsticle);

	    curr = new OpenLayers.Feature.Vector(
		    new OpenLayers.Geometry.Point(long, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
 		    {description: id} ,
		    {externalGraphic:'map_app/img/sphere_obst.png', graphicHeight: 30, graphicWidth: 30, graphicXOffset:-12, graphicYOffset:-25 }
		    );

        objectObstMov.Obsticles[i].Obsticle = curr;
	    vectorLayer.addFeatures(curr);
	    UpdateLayer(vectorLayer);
    }
    if (isContained) {
    	while (objectObstMov.Obsticles[i].obsticleLocation.length >= 45) {
        	vectorLayer.removeFeatures(objectObstMov.Obsticles[i].obsticleLocation[0]);
        	objectObstMov.Obsticles[i].obsticleLocation.shift();
    	}
    } else {
    	createMovingObsticle(long, lat, id);
    }

  }
}
