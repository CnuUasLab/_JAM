map = new OpenLayers.Map("mapdiv");
map.addLayer(new OpenLayers.Layer.OSM());


// This is the longitude and latitude for the marker for the plane. We need to extract telemetry data and insert that.
/*
    var lonlatMark = new OpenLayers.LonLat( -76.408467, 38.285838 )                     
        .transform(                                                             
            new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984  
            map.getProjectionObject() // to Spherical Mercator Projection       
        );         
*/

    var zoom=15;

    //The vector layer
    var vectorLayer = new OpenLayers.Layer.Vector("Overlay");

    //Make the feature a plain OpenLayers marker
    var feature = new OpenLayers.Feature.Vector(
        new OpenLayers.Geometry.Point(-76.408467, 38.285838).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()),
        {description:'X-8 Plane for AUVSI SUAS Competition'} ,
        {externalGraphic: 'img/planeicon.png', graphicHeight: 25, graphicWidth: 15, graphicXOffset:-12, graphicYOffset:-25  }
    );
                     
            vectorLayer.addFeatures(feature);
            map.addLayer(vectorLayer);

// Where to position the map.
var lonLat = new OpenLayers.LonLat( -76.408467, 38.285838 )                     
            .transform(                                                             
                  new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984  
                  map.getProjectionObject() // to Spherical Mercator Projection       
             );
map.setCenter (lonLat, zoom);

