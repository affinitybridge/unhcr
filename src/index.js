/*
 * This is the main file where we program the application JS. This code is then
 * processed through Browserify to protect namespace.
 */

// Require some libs. 
var $ = require('jquery'),
    L = require('leaflet'),
    crossfilter = require('crossfilter'),
    console = require('console'),
    categoryFilter = require("./CategoryFilter");
// Mapbox automatically attaches to Leaflet's L.
require('mapbox.js');

// Initialize the map, using Affinity Bridge's mapbox account.
var map = L.mapbox.map('map', 'affinitybridge.ia7h38nj');
// Add the data layer to the map.
var dataLayer = L.geoJson(null, {
    // Add the info popups - commented out for now
    onEachFeature: function (feature, layer) {
        layer.bindPopup(feature.properties.locationName);
    }
}).addTo(map);

// Define the filters
// TODO: add the rest of the filters, as an array, so we can loop through them later
var cf = crossfilter();
var cf_activityCategory = categoryFilter({
    container: 'activityCategoryFilter',
    type: 'radio',
    key: 'activityCategory',
    empty: 'Not even in a category'
}, cf);
var cf_locationName = categoryFilter({
        container: 'locationNameFilter',
        type: 'checkbox',
        key: 'locationName',
        empty: 'No location name'
    }, cf);

// Special dimension, used to grab the final set of data with all other dimensions' filters applied.
var dimension = cf.dimension(function (f) { return f.properties.activityCategory; });

// Whenever the user changes their selection in the filters, run our update() method.
// Bind the update() method to the "update" event on the category filter.
cf_activityCategory.on('update', update);
cf_locationName.on('update', update);
// TODO: loop through an array of filters

// Define the data sources.
// TODO: provide a way to administer the data sources.
var jsonSourceURLs = [
    "https://www.syrianrefugeeresponse.org/resources/sites/points?activity=5574",
    "https://www.syrianrefugeeresponse.org/resources/sites/points?activity=5579",
    "https://www.syrianrefugeeresponse.org/resources/sites/points?activity=5601",
    "https://www.syrianrefugeeresponse.org/resources/sites/points?activity=5603",
    "https://www.syrianrefugeeresponse.org/resources/sites/points?activity=5610"
];

// Store the data as it comes in asynchronously, and update the filters and the map layer.
var jsonSources = [],
    onSuccess = function (data, textStatus, jqXHR) {
        jsonSources = jsonSources.concat(data.features);

        // Add the new data to the crossfilter
        cf.add(data.features);
        update();
    };

// Get the data from the sources.
for (var i in jsonSourceURLs) {
    var jsonObject = jQuery.get(jsonSourceURLs[i], onSuccess);
}


// Functions...

// Update the markers based on the user's filter input.
function update() {
    // TODO: loop through an array of filters
    cf_activityCategory.update();
    cf_locationName.update();
    render();
}

// Clear the data layer and re-render.
function render() {
    dataLayer.clearLayers();
    dataLayer.addData(dimension.top(Infinity));
}

