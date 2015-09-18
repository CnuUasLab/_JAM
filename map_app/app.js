
    
    // Generate google maps with initial starting point at Patuxant Naval Airbase
    var myLatlng = new google.maps.LatLng(38.285838,-76.408467); // These are the coordinates for the PNAB - I don't know if this is correct though.
    var myOptions = {
        zoom: 13,  // We can change this later for viewing purposes.
        center: myLatlng,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
    }
    var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);


