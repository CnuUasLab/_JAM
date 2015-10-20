map = new OpenLayers.Map("mapdiv");
map.addLayer(new OpenLayers.Layer.OSM());

    var zoom=17;

    //The vector layer
    var vectorLayer = new OpenLayers.Layer.Vector("Overlay");

    //Make the feature a plain OpenLayers marker
    var feature = new OpenLayers.Feature.Vector(
	new OpenLayers.Geometry.Point(-76.427991, 38.144616).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
        {description:'X-8 Plane for AUVSI SUAS Competition'} ,
        {externalGraphic: '/map_app/img/star_plane.png', graphicHeight: 30, graphicWidth: 30, graphicXOffset:-12, graphicYOffset:-25  }
        //{externalGraphic: '/map_app/img/track_pixel.png', graphicHeight: 10, graphicWidth: 10, graphicXOffset:-4, graphicYOffset:-13} * This is just for georss accuracy *
    );
                     
    vectorLayer.addFeatures(feature);
    map.addLayer(vectorLayer);

// Where to position the map.
var lonLat = new OpenLayers.LonLat( -76.427991,38.144616 )                     
            .transform(                                                             
                  new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984  
                  map.getProjectionObject() // to Spherical Mercator Projection       
             );
map.setCenter (lonLat, zoom);

//US Naval Electronic systems center  LonLat: (-76.427991, 38.144616)
function changePlaneLoc(lon, lat) {
    // feature.style.externalGraphic = '/map_app/img/track_pixel.png';
    feature.style.graphicHeight = 10;
    feature.style.graphicWidth = 10;
    feature.style.graphicXOffset = -4;
    feature.style.graphicYOffset = -13;

    vectorLayer.addFeatures(feature);
    feature = new OpenLayers.Feature.Vector(
        new OpenLayers.Geometry.Point(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
        {description:'X-8 Plane for AUVSI Competition'} ,
        {externalGraphic:'/map_app/img/star_plane.png', graphicHeight: 30, graphicWidth: 29, graphicXOffset:-12, graphicYOffset:-25 }
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
		      {externalGraphic:'/map_app/img/cylinder_obst.png', graphicHeight: 30, graphicWidth: 30, graphicXOffset:-12, graphicYOffset:-25}
					 );
    vectorLayer.addFeatures(obst);
}

//creating an array of moving obsticles
var arrayObstMov = [];

function createMovingObsticle(long, lat, id) {
    obst_mov = new OpenLayers.Feature.Vector(
		      new OpenLayers.Geometry.Point( long, lat ).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
		      {description: id},
	     	      {externalGraphic:'/map_app/img/sphere_obst.png', graphicHeight: 30, graphicWidth: 30, graphicXOffset:-12, graphicYOffset:-25}
    );
    arrayObstMov.push(obst_mov);
    vectorLayer.addFeatures(obst_mov);
}

//function to change the location of a moving obsticle.
function changeMovingObsticleLoc(long, lat, id) {
    var curr;
    for (var i = 0; i < arrayObstMov.length; i++) {
	if (arrayObstMov[i].attributes.description == id) {
	    curr = arrayObstMov[i];
	    
	    curr.style.externalGraphic = '/map_app/img/track_pixel_obst.png';
	    curr.style.graphicHeight = 10;
	    curr.style.graphicWidth = 10;
	    curr.style.graphicXOffset = -4;
	    curr.style.graphicYOffset = -13;

	    vectorLayer.addFeatures(curr);
	    curr = new OpenLayers.Feature.Vector(
		    new OpenLayers.Geometry.Point(long, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
 		    {description: id} ,
		    {externalGraphic:'/map_app/img/sphere_obst.png', graphicHeight: 30, graphicWidth: 30, graphicXOffset:-12, graphicYOffset:-25 }
		    );
	    vectorLayer.addFeatures(curr);
	    UpdateLayer(vectorLayer);
	}
    }
}

