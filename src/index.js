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

// TEMPORARY - get the sample data.  Later we will get all the data here and combine it.
// var sampleGeoJSON = "https://www.syrianrefugeeresponse.org/resources/sites/points?activity=5601";
var sampleGeoJSON = "https://www.syrianrefugeeresponse.org/resources/sites/points?activity=5574";

// Fetch the data, and when it arrives, generate the filters.
jQuery.get(sampleGeoJSON, function (data, textStatus, jqXHR) {

  // Debug
  console.log('==============================', textStatus, '==============================', data);

  // Add the data layer to the map.
  var dataLayer = L.geoJson(data, {
    /* Add the info popups - commented out for now
    onEachFeature: function (feature, layer) {
      layer.bindPopup(feature.properties.description);
    }
    */
  }).addTo(map);

  // Define the filters
  var cf = crossfilter(data.features),
      category = categoryFilter({
        container: 'activityCategoryFilter',
        type: 'checkbox', // Could be "radio"
        key: 'locationName',
        empty: 'Not even in a category'
      }, cf);
  // Whenever the user changes their selection in the filters, run our update() method.
  category.on('update', update);  

  // Kind of re-define the filter.  Why is this line necessary, again?
  var dimension = cf.dimension(function (f) { return f.properties.activityCategory; });

  // Update the markers based on the user's filter input.
  function update() {
    category.update();
    render();
  }

  // Clear the data layer and re-render.
  function render() {
    dataLayer.clearLayers();
    dataLayer.addData(dimension.top(Infinity));
  }

});


