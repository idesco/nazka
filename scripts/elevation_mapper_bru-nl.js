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
    var myLatlng = new google.maps.LatLng(50.82452967415672, 4.412455989563);
    var myOptions = {
      zoom: 13,
      center: myLatlng,
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
  
  
function addBrussel(latlng, doQuery) {
		
		var vertex = {
		  path: google.maps.SymbolPath.CIRCLE,
		  fillColor: "#16c1f3",
		  fillOpacity: 0.0,
		  scale: 1,
		  strokeColor: "#16c1f3",
		  strokeWeight: 0
		};
		
        var marker = new google.maps.Marker({
        position: latlng,
		icon: vertex,
        map: map,
        draggable: false
      })
      
      markers.push(marker);
	  
	   if (doQuery) {
        updateElevation();
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
        var brusselpath = [];
        for (var i in markers) {
          brusselpath.push(markers[i].getPosition())
        }
        elevationService.getElevationAlongPath({
          path: brusselpath,
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
	reset();
		
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
	
		latlngs = [
			[50.842167,4.387169],
			[50.84241500000001,4.38643],
			[50.84288399999999,4.385543],
			[50.842842,4.385023],
			[50.84296,4.384443],
			[50.842754,4.383434],
			[50.842918,4.382101],
			[50.843018,4.381356],
			[50.843048,4.380393],
			[50.843136,4.379858],
			[50.843491,4.379698],
			[50.843742,4.379434],
			[50.84385700000001,4.379018],
			[50.84360099999999,4.378349],
			[50.843609,4.377752],
			[50.843784,4.376966],
			[50.84409,4.376521],
			[50.84429899999999,4.375824],
			[50.84424200000001,4.375463],
			[50.84439499999999,4.374515],
			[50.844753,4.373336],
			[50.844883,4.372565],
			[50.844894,4.371965],
			[50.845097,4.371561],
			[50.845188,4.371026],
			[50.845394,4.3706],
			[50.84546700000001,4.370124],
			[50.845455,4.369785],
			[50.845757,4.368804],
			[50.845592,4.36847],
			[50.84573,4.367871],
			[50.846176,4.366909],
			[50.84584799999999,4.366739],
			[50.844955,4.366208],
			[50.844559,4.365975],
			[50.84316999999999,4.365242],
			[50.84252500000001,4.364953],
			[50.84236499999999,4.364557],
			[50.842861,4.361421],
			[50.842937,4.360315],
			[50.842602,4.359879],
			[50.842056,4.359054],
			[50.841736,4.358756],
			[50.84120900000001,4.358103],
			[50.840614,4.357275],
			[50.84051100000001,4.356903],
			[50.840221,4.356554],
			[50.839386,4.355444],
			[50.838894,4.354784],
			[50.837914,4.353491],
			[50.837746,4.353091],
			[50.837372,4.352888],
			[50.837124,4.353007],
			[50.8367,4.353942],
			[50.836258,4.354789],
			[50.83601229016195,4.354991316769459],
			[50.83579448938627,4.355424115495136],
			[50.83553623234292,4.355440595625937],
			[50.83421836931698,4.356737203679901],
			[50.8337295413259,4.35722931541882],
			[50.83350410074834,4.35742298082727],
			[50.83328747592766,4.357672473689441],
			[50.83306864271023,4.357921089163927],
			[50.8329821541632,4.358108057682076],
			[50.83261499999999,4.35851],
			[50.83249699999999,4.358594],
			[50.83182500000001,4.359369],
			[50.831467,4.359655],
			[50.830574,4.360844],
			[50.830074,4.361235],
			[50.829689,4.361644],
			[50.829208,4.362161],
			[50.82878100000001,4.362473],
			[50.82771911840542,4.36349246020616],
			[50.8265653019438,4.364708922643681],
			[50.82623700000001,4.365039],
			[50.825722,4.365626],
			[50.82539400000001,4.365863],
			[50.824932,4.366348],
			[50.824604,4.366716],
			[50.82424199999999,4.367059],
			[50.82336,4.368004],
			[50.823044,4.368411],
			[50.822845,4.368921],
			[50.822453,4.36899],
			[50.822052,4.36934],
			[50.821472,4.369872],
			[50.820995,4.370239],
			[50.820145,4.370518],
			[50.819405,4.370832],
			[50.81890500000001,4.371044],
			[50.818165,4.371357],
			[50.817795,4.371769],
			[50.817467,4.37192],
			[50.816849,4.372094],
			[50.815914,4.372508],
			[50.81549799999999,4.372597],
			[50.81489599999999,4.372714],
			[50.814655,4.372457],
			[50.81425899999999,4.372464],
			[50.81397599999999,4.372049],
			[50.813805,4.371268],
			[50.81375899999999,4.37053],
			[50.81344599999999,4.369987],
			[50.81300400000001,4.369784],
			[50.812569,4.369831],
			[50.811775,4.369957],
			[50.811111,4.370189],
			[50.81041299999999,4.370502],
			[50.809502,4.371237],
			[50.80831500000001,4.372719],
			[50.80787999999999,4.37337],
			[50.807316,4.37423],
			[50.80684999999999,4.375544],
			[50.806725,4.376897],
			[50.806671,4.377618],
			[50.806339,4.378022],
			[50.806065,4.378098],
			[50.805649,4.377843],
			[50.80517200000001,4.377444],
			[50.804508,4.377479],
			[50.804058,4.377881],
			[50.803673,4.378545],
			[50.803097,4.379912],
			[50.802849,4.38006],
			[50.801975,4.379358],
			[50.801453,4.379077],
			[50.801121,4.379106],
			[50.800652,4.379418],
			[50.799896,4.380266],
			[50.799633,4.381233],
			[50.799236,4.382637],
			[50.799263,4.383853],
			[50.799213,4.384497],
			[50.799488,4.385916],
			[50.800091,4.386909],
			[50.80077,4.387373],
			[50.801334,4.387115],
			[50.801662,4.386724],
			[50.802071,4.386219],
			[50.80257799999999,4.385535],
			[50.80315,4.384741],
			[50.803631,4.384248],
			[50.80404300000001,4.384173],
			[50.805099,4.38377],
			[50.806015,4.38317],
			[50.806629,4.382601],
			[50.80711700000001,4.382124],
			[50.807262,4.382271],
			[50.806999,4.383404],
			[50.80664399999999,4.383925],
			[50.806023,4.384558],
			[50.805794,4.38498],
			[50.805786,4.38579],
			[50.805214,4.386398],
			[50.80427899999999,4.387079],
			[50.803822,4.387468],
			[50.802837,4.388317],
			[50.801163,4.389945],
			[50.800518,4.39061],
			[50.799595,4.391733],
			[50.79813,4.393874],
			[50.797054,4.396221],
			[50.796692,4.398174],
			[50.796345,4.400853],
			[50.796043,4.403418],
			[50.79584499999999,4.404807],
			[50.79550200000001,4.406889],
			[50.79517,4.407395],
			[50.79534499999999,4.408045],
			[50.79540600000001,4.409527],
			[50.795456,4.411187],
			[50.795551,4.412781],
			[50.796043,4.414767],
			[50.796581,4.415913],
			[50.797859,4.417844],
			[50.79826000000001,4.419007],
			[50.798492,4.419249],
			[50.799274,4.421039],
			[50.799969,4.421782],
			[50.800632,4.422123],
			[50.801476,4.422704],
			[50.802334,4.423619],
			[50.803143,4.424846],
			[50.804276,4.425972],
			[50.805225,4.426468],
			[50.80577100000001,4.426567],
			[50.80630100000001,4.426703],
			[50.806789,4.426805],
			[50.808559,4.427181],
			[50.809574,4.427364],
			[50.810154,4.427526],
			[50.811218,4.42765],
			[50.81229,4.427353],
			[50.813862,4.426289],
			[50.814919,4.425818],
			[50.815742,4.425773],
			[50.817471,4.426277],
			[50.818489,4.427102],
			[50.819344,4.428667],
			[50.81987399999999,4.429414],
			[50.820286,4.429799],
			[50.82082,4.430218],
			[50.822712,4.43111],
			[50.823318,4.431274],
			[50.824547,4.431457],
			[50.825241,4.431616],
			[50.826122,4.431368],
			[50.827057,4.431358],
			[50.82813999999999,4.43178],
			[50.828705,4.432256],
			[50.829617,4.433354],
			[50.82991800000001,4.433486],
			[50.830334,4.433283],
			[50.831757,4.432337],
			[50.833565,4.430832],
			[50.833977,4.430218],
			[50.834496,4.428836],
			[50.834702,4.427664],
			[50.834435,4.424111],
			[50.834351,4.421615],
			[50.835087,4.417858],
			[50.835461,4.416087],
			[50.835991,4.414022],
			[50.83618899999999,4.412864],
			[50.836735,4.410125],
			[50.836975,4.409092],
			[50.837112,4.408461],
			[50.837009,4.407635],
			[50.837097,4.407113],
			[50.83753600000001,4.406524],
			[50.837791,4.405079],
			[50.838776,4.400566],
			[50.83942,4.39742],
			[50.839531,4.396595],
			[50.839344,4.395772],
			[50.839443,4.395071],
			[50.83976,4.394621],
			[50.840199,4.39426],
			[50.840374,4.393738],
			[50.84042,4.393345],	
							];
    
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < latlngs.length; i++) {
      var latlng = new google.maps.LatLng(
        latlngs[i][0],
        latlngs[i][1]
      );
      addBrussel(latlng);
      bounds.extend(latlng);
    }
    map.fitBounds(bounds);
    putElevation();
	
	layer = new google.maps.FusionTablesLayer({
			map: map,
			heatmap: { enabled: false },
			query: {
			select: "col3",
			from: "1qKStr4qfp_Yj_egO5yl88Hp9K0e_4NeuPKCjS9Q",
			where: ""
			},
			options: {
			styleId: 2,
			templateId: 2
			}
			});	
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
