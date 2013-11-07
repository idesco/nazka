  var map = null;
  var chart = null;
  
  var geocoderService = null;
  var elevationService = null;
  var directionsService = null;
  
  var mousemarker = null;
  var markers = [];
  var polyline = null;
  var elevations = null;
	
  var SAMPLES = 256;
  

  // Load the Visualization API and the piechart package.
  google.load("visualization", "1", {packages: ["columnchart"]});
  
  // Set a callback to run when the Google Visualization API is loaded.
  google.setOnLoadCallback(initialize);
  
function initialize() {
    var myOptions = {
      zoom: 8,
      center: new google.maps.LatLng(50.82452967415672, 4.412455989563),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }
	
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
    
    geocoderService = new google.maps.Geocoder();
    elevationService = new google.maps.ElevationService();
    directionsService = new google.maps.DirectionsService();
	
	google.maps.event.addListener(map, 'click', function(event) {
      addMarker(event.latLng, true);
    });
    
    
	// add  rollover when moving mouse on the chart
	google.visualization.events.addListener(chart, 'onmouseover', function(e) {
      if (mousemarker == null) {
        mousemarker = new google.maps.Marker({
          position: elevations[e.row].location,
          map: map,
          icon: "http://www.nazka.be/pics/nazka_label.png"
        });
      } else {
        mousemarker.setPosition(elevations[e.row].location);
      }
    });
	
	 loadBrussels();
	
  }
  
// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a GViz ColumnChart
function plotElevation(results) {
    elevations = results;
    
    var path = [];
    for (var i = 0; i < results.length; i++) {
      path.push(elevations[i].location);
    }
    
    if (polyline) {
      polyline.setMap(null);
    }
    //#16c1f3
    polyline = new google.maps.Polyline({
      path: path,
      strokeColor: "#16c1f3",
	  strokeOpacity: 1.0,
      strokeWeight: 8,
      map: map});
	document.getElementById("distance").innerHTML = (polyline.Distance()/1000).toFixed(2)+" km";
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Sample');
    data.addColumn('number', 'Elevation');
    for (var i = 0; i < results.length; i++) {
      data.addRow(['', elevations[i].elevation]);
    }

    document.getElementById('chart_div').style.display = 'block';
    chart.draw(data, {
      height: 230,
	  borderColor: "#16c1f3",
	  backgroundColor: "#4C4D4F",
	  colors: "#16c1f3",
      legend: 'none',
      titleY: 'Hoogte (m)',
	  title: 'Beweeg je cursor over het hoogteprofiel',
      focusBorderColor: '#fff',
	  titleColor: "#fff",
	  axisFontsize: 12,
	  titleFontSize: 14,
    });
  }
  
// Remove the green rollover marker when the mouse leaves the chart
function clearMouseMarker() {
    if (mousemarker != null) {
      mousemarker.setMap(null);
      mousemarker = null;
    }
  }
  
// Geocode an address and add a marker for the result
function addAddress() {
    var address = document.getElementById('address').value;
    geocoderService.geocode({ 'address': address }, function(results, status) {
      document.getElementById('address').value = "";
      if (status == google.maps.GeocoderStatus.OK) {
        var latlng = results[0].geometry.location;
        addMarker(latlng, true);
        if (markers.length > 1) {
          var bounds = new google.maps.LatLngBounds();
          for (var i in markers) {
            bounds.extend(markers[i].getPosition());
          }
          map.fitBounds(bounds);
        } else {
          map.fitBounds(results[0].geometry.viewport);
        }
      } else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
        alert("Address not found");
      } else {
        alert("Address lookup failed");
      }
    })
  }
  
// Add a marker and trigger recalculation of the path and elevation
function addMarker(latlng, doQuery) {
	if (markers.length < 10) {
      
      var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        draggable: true
      })
      
      google.maps.event.addListener(marker, 'dragend', function(e) {
        updateElevation();
      });
      
      markers.push(marker);
      
      if (doQuery) {
        updateElevation();
      }
      
      if (markers.length == 10) {
        document.getElementById('address').disabled = true;
      }
    } else {
      alert("Verwijder eerst de bestaande route door op onderstaande button te klikken. Het aantal routepunten is beperkt tot 10");
    }
  }
  
// Trigger the elevation query for point to point
// or submit a directions request for the path between points
function updateElevation() {
    if (markers.length > 1) {
      var travelMode = document.getElementById("mode").value;
      if (travelMode != 'direct') {
        calcRoute(travelMode);
      } else {
        var latlngs = [];
        for (var i in markers) {
          latlngs.push(markers[i].getPosition())
        }
        elevationService.getElevationAlongPath({
          path: latlngs,
          samples: SAMPLES
        }, plotElevation);
      }
    }
  }

function putElevation() {
        var path = [];
        for (var i in markers) {
          path.push(markers[i].getPosition())
        }
        elevationService.getElevationAlongPath({
          path: path,
          samples: SAMPLES
        }, plotElevation);
  }

  
// Submit a directions request for the path between points and an
// elevation request for the path once returned
function calcRoute(travelMode) {
    var origin = markers[0].getPosition();
    var destination = markers[markers.length - 1].getPosition();
    
    var waypoints = [];
    for (var i = 1; i < markers.length - 1; i++) {
      waypoints.push({
        location: markers[i].getPosition(),
        stopover: true
      });
    }
    
    var request = {
      origin: origin,
      destination: destination,
      waypoints: waypoints
    };
   
    switch (travelMode) {
      case "bicycling":
        request.travelMode = google.maps.DirectionsTravelMode.BICYCLING;
        break;
      case "driving":
        request.travelMode = google.maps.DirectionsTravelMode.DRIVING;
        break;
      case "walking":
        request.travelMode = google.maps.DirectionsTravelMode.WALKING;
        break;
    }
    
    directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        elevationService.getElevationAlongPath({
          path: response.routes[0].overview_path,
          samples: SAMPLES
        }, plotElevation);
      } else if (status == google.maps.DirectionsStatus.ZERO_RESULTS) {
        alert("Could not find a route between these points");
      } else {
        alert("Directions request failed");
      }
    });
  }

// Trigger a geocode request when the Return key is
// pressed in the address field
function addressKeyHandler(e) {
    var keycode;
    if (window.event) {
      keycode = window.event.keyCode;
    } else if (e) {
      keycode = e.which;
    } else {
      return true;
    }
    
    if (keycode == 13) {
       addAddress();
       return false;
    } else {
       return true;
    }
  }
  
function loadBrussels() {
		
	var style = [
		  {
			"featureType": "road.highway",
			"elementType": "geometry.fill",
			"stylers": [
			  { "visibility": "on" },
			  { "color": "#ffffff" },
			  { "weight": 3 }
			]
		  },{
			"featureType": "road.highway",
			"elementType": "labels.text.fill",
			"stylers": [
			  { "visibility": "on" },
			  { "color": "#9272de" }
			]
		  },{
			"featureType": "road.arterial",
			"elementType": "geometry.fill",
			"stylers": [
			  { "visibility": "on" },
			  { "weight": 3 },
			  { "color": "#d3d4d6" }
			]
		  },{
			"featureType": "road.arterial",
			"elementType": "labels.text.fill",
			"stylers": [
			  { "visibility": "on" },
			  { "color": "#9272de" }
			]
		  },{
			"featureType": "road.local",
			"elementType": "labels",
			"stylers": [
			  { "visibility": "off" }
			]
		  },{
			"featureType": "road.local",
			"elementType": "geometry.fill",
			"stylers": [
			  { "visibility": "on" },
			  { "color": "#808080" },
			  { "weight": 1 }
			]
		  },{
			"featureType": "administrative.locality",
			"elementType": "labels.text.fill",
			"stylers": [
			  { "visibility": "on" },
			  { "color": "#ba2e4e" },
			  { "weight": 2 }
			]
		  },{
			"featureType": "poi",
			"elementType": "labels",
			"stylers": [
			  { "visibility": "off" }
			]
		  },{
			"featureType": "transit",
			"elementType": "labels",
			"stylers": [
			  { "visibility": "off" }
			]
		  },{
			"featureType": "poi.park",
			"elementType": "geometry.fill",
			"stylers": [
			  { "visibility": "on" },
			  { "color": "#92b06e" }
			]
		  },{
			"featureType": "poi.medical",
			"stylers": [
			  { "visibility": "off" }
			]
		  },{
			"featureType": "road.highway",
			"elementType": "labels.text.fill",
			"stylers": [
			  { "visibility": "on" },
			  { "color": "#9172de" }
			]
		  },{
			"featureType": "road.highway",
			"elementType": "labels.text.stroke",
			"stylers": [
			  { "visibility": "on" },
			  { "color": "#ffffff" }
			]
		  },{
			"featureType": "road.arterial",
			"elementType": "labels.text.stroke",
			"stylers": [
			  { "visibility": "on" },
			  { "color": "#ffffff" }
			]
		  },{
			"featureType": "road.arterial",
			"elementType": "geometry.stroke",
			"stylers": [
			  { "visibility": "on" },
			  { "color": "#ffffff" }
			]
		  }
		];

        var styledMapType = new google.maps.StyledMapType(style, {
          map: map,
          name: 'Styled Map'
        });

        map.mapTypes.set('map-style', styledMapType);
        map.setMapTypeId('map-style');
  }
  
// Clear all overlays, reset the array of points, and hide the chart
function reset() {
    document.getElementById("distance").innerHTML = "0 km";
	if (polyline) {
      polyline.setMap(null);
    }
    
    for (var i in markers) {
      markers[i].setMap(null);
    }
    
    markers = [];
	document.getElementById('chart_div').style.display = 'none';
	
  }
