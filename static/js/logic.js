// Two overlay groups
var earthquakeLayer = new L.layerGroup();
var tectLayer = new L.layerGroup();

var overlays = {
    Earthquakes: earthquakeLayer,
    "Tectonic Plates":tectLayer
}

// Adding the tile layers
var geoLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href=https://www.openstreetmap.org/copyright>OpenStreetMap</a> contributors'
})

var satelliteLayer = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.satellite",
    accessToken: API_KEY
  });

  var grayscaleLayer = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
  tileSize: 512,
  maxZoom: 18,
  zoomOffset: -1,
  id: "mapbox/light-v10",
  accessToken: API_KEY
});

// base layers
var baseLayers = {
    Outdoor: geoLayer, 
    Satellite: satelliteLayer, 
    "Gray Scale": grayscaleLayer
} 

// Creating the map object
var myMap = L.map("map", {
    center: [37.6, -95.665],
    zoom: 3.5, 
    // Display on load
    layers: [satelliteLayer, earthquakeLayer]
});

// Layer control
L.control.layers(baseLayers, overlays, {
    collapsed: false
  }).addTo(myMap);

// Getting the colors for the circles and legend based on depth
function getColor(depth) {
    return depth >= 90 ? "#FF0D0D" :
        depth < 90 && depth >= 70 ? "#FF4E11" :
        depth < 70 && depth >= 50 ? "#FF8E15" :
        depth < 50 && depth >= 30 ? "#FFB92E" :
        depth < 30 && depth >= 10 ? "#ACB334" :
                                    "#69B34C";
}

// Drawing the circles
function drawCircle(point, latlng) {
    let mag = point.properties.mag;
    let depth = point.geometry.coordinates[2];
    return L.circle(latlng, {
            fillOpacity: 0.5,
            color: getColor(depth),
            fillColor: getColor(depth),
            // The size of the circle is based on magnitude of the earthquake
            radius: mag * 20000
    })
}

// Displaying info when the feature is clicked
function bindPopUp(feature, layer) {
    layer.bindPopup(`Location: ${feature.properties.place} <br> Magnitude: ${feature.properties.mag} <br> Depth: ${feature.geometry.coordinates[2]}`);
}

// The link to get the Earthquak GeoJSON data
var url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

// Getting the GeoJSON data
d3.json(url).then((data) => {
    var features = data.features;

    // Creating a GeoJSON layer with the retrieved data
    L.geoJSON(features, {
        pointToLayer: drawCircle,
        onEachFeature: bindPopUp
    }).addTo(earthquakeLayer);

    // Setting up the legend
    var legend = L.control({position: 'bottomright'});

    legend.onAdd = () => {
        var div = L.DomUtil.create('div', 'info legend');
        var grades = [-10, 10, 30, 50, 70, 90];
        var labels = ["<div style='background-color: lightgray'><strong>&nbsp&nbspDepth (km)&nbsp&nbsp</strong></div>"];
       
        // Looping through our intervals and generating a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            labels.push('<li style="background-color:' + getColor(grades[i] + 1) + '"> <span>' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '' : '+') + '</span></li>');
        }

        // add each label list item to the div under the <ul> tag
        div.innerHTML += '<ul style="list-style-type:none; text-align: center">' + labels.join("") + "</ul>";

        return div;
    };
    legend.addTo(myMap);
})
   
// Adding a Scale to a map
L.control.scale()
.addTo(myMap);

// The link to get the tectonic plate boundaries data
var tectonicURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

d3.json(tectonicURL).then((tectData) => {
    L.geoJSON(tectData, {
        color: "rgb(255, 94, 0)",
        weight: 2
    }).addTo(tectLayer);

    tectLayer.addTo(myMap);
})
