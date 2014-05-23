/*
 * This is the main file where we program the application JS. This code is then
 * processed through Browserify to protect namespace.
 */

// Require some libs. 
var $ = require('jquery'),
//    L = require('leaflet'),
    crossfilter = require('crossfilter'),
    console = require('console'),
    categoryFilter = require("./CategoryFilter");
// Mapbox doesn't need its own var - it automatically attaches to Leaflet's L.
require('mapbox.js');

// Initialize the map, using Affinity Bridge's mapbox account.
var map = L.mapbox.map('map', 'affinitybridge.ia7h38nj');
// Add the data layer to the map.
var dataLayer = L.geoJson(null, {
    // Add the info popups.
    onEachFeature: function (feature, layer) {
        var comments = feature.properties.comments ? feature.properties.comments.replace(/\r\n|\n|\r/g, '<br />') : null;
        layer.bindPopup('<h3>' + feature.properties.locationName + '</h3>' + comments);
    }
}).addTo(map);

// Define the filters
// TODO: add the filters as an array, so we can loop through them later
var cf = crossfilter();
var cf_partnerName = categoryFilter({
    container: 'partnerName',
    type: 'checkbox',
    key: 'partnerName',
    empty: 'No data'
}, cf);
var cf_activityCategory = categoryFilter({
    container: 'activityCategory',
    type: 'checkbox',
    key: 'activityCategory',
    empty: 'Not even in a category'
}, cf);
var cf_activityName = categoryFilter({
    container: 'activityName',
    type: 'checkbox',
    key: 'activityName',
    empty: 'No data'
}, cf);
var cf_locationName = categoryFilter({
    container: 'locationName',
    type: 'checkbox',
    key: 'locationName',
    empty: 'No location name'
}, cf);
var cf_startDate = categoryFilter({
    container: 'startDate',
    type: 'checkbox',
    key: 'startDate',
    empty: 'No data'
}, cf);
var cf_endDate = categoryFilter({
    container: 'endDate',
    type: 'checkbox',
    key: 'endDate',
    empty: 'No data'
}, cf);

/* The rest of these fields have a data structure which FilterControl.js can't handle yet.
var cf_indicators = categoryFilter({
    container: 'indicatorsFilter',
    type: 'checkbox',
    key: 'indicators',
    empty: 'No data'
}, cf);
var cf_1 = categoryFilter({
    container: 'filter1',
    type: 'checkbox',
    key: '1. Registration Type Requirement',
    empty: 'No data'
}, cf);
var cf_2 = categoryFilter({
    container: 'filter2',
    type: 'checkbox',
    key: '2. Nationality',
    empty: 'No data'
}, cf);
var cf_3 = categoryFilter({
    container: 'filter3',
    type: 'checkbox',
    key: '3. Intake Criteria',
    empty: 'No data'
}, cf);
var cf_4 = categoryFilter({
    container: 'filter4',
    type: 'checkbox',
    key: '4. Accessibility',
    empty: 'No data'
}, cf);
var cf_5 = categoryFilter({
    container: 'filter5',
    type: 'checkbox',
    key: '5. Coverage',
    empty: 'No data'
}, cf);
var cf_6 = categoryFilter({
    container: 'filter6',
    type: 'checkbox',
    key: '6. Availability',
    empty: 'No data'
}, cf);
var cf_7 = categoryFilter({
    container: 'filter7',
    type: 'checkbox',
    key: '7. Availability Day',
    empty: 'No data'
}, cf);
var cf_8 = categoryFilter({
    container: 'filter8',
    type: 'checkbox',
    key: '8. Office Open at',
    empty: 'No data'
}, cf);
var cf_9 = categoryFilter({
    container: 'filter9',
    type: 'checkbox',
    key: '9. Office close at',
    empty: 'No data'
}, cf);
var cf_10 = categoryFilter({
    container: 'filter10',
    type: 'checkbox',
    key: '10. Referral Method',
    empty: 'No data'
}, cf);
var cf_11 = categoryFilter({
    container: 'filter11',
    type: 'checkbox',
    key: '11. Immediate Next step response after referal',
    empty: 'No data'
}, cf);
var cf_12 = categoryFilter({
    container: 'filter12',
    type: 'checkbox',
    key: '12. Response delay after referrals',
    empty: 'No data'
}, cf);
var cf_13 = categoryFilter({
    container: 'filter13',
    type: 'checkbox',
    key: '13. Feedback Mechanism',
    empty: 'No data'
}, cf);
var cf_14 = categoryFilter({
    container: 'filter14',
    type: 'checkbox',
    key: '14. Feedback delay',
    empty: 'No data'
}, cf);
*/


// Special meta-dimension for our crossFilter dimensions, used to grab the final set
// of data with all other dimensions' filters applied.
var dimension = cf.dimension(function (f) { return f.properties.activityCategory; });

// Whenever the user changes their selection in the filters, run our update() method.
// Bind the update() method to the "update" event on the category filter.
// TODO: loop through an array of filters
cf_partnerName.on('update', update);
cf_activityCategory.on('update', update);
cf_activityName.on('update', update);
cf_locationName.on('update', update);
cf_startDate.on('update', update);
cf_endDate.on('update', update);
/*
cf_indicators.on('update', update);
cf_1.on('update', update);
cf_2.on('update', update);
cf_3.on('update', update);
cf_4.on('update', update);
cf_5.on('update', update);
cf_6.on('update', update);
cf_7.on('update', update);
cf_8.on('update', update);
cf_9.on('update', update);
cf_10.on('update', update);
cf_11.on('update', update);
cf_12.on('update', update);
cf_13.on('update', update);
cf_14.on('update', update);
*/

// Define the data sources.
// TODO: aggregate these separately.
var jsonSourceURLs = [
    "https://www.syrianrefugeeresponse.org/resources/sites/points?activity=5574",
    "https://www.syrianrefugeeresponse.org/resources/sites/points?activity=5579",
    "https://www.syrianrefugeeresponse.org/resources/sites/points?activity=5601",
    "https://www.syrianrefugeeresponse.org/resources/sites/points?activity=5603",
    "https://www.syrianrefugeeresponse.org/resources/sites/points?activity=5610"
];

// Store the data as it comes in asynchronously, and update the filters and the map layer.
// TODO: once we're aggregating the data sources separately, we won't need this anymore.
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
    cf_partnerName.update();
    cf_activityCategory.update();
    cf_activityName.update();
    cf_locationName.update();
    cf_startDate.update();
    cf_endDate.update();
    /*
    cf_indicators.update();
    cf_1.update();
    cf_2.update();
    cf_3.update();
    cf_4.update();
    cf_5.update();
    cf_6.update();
    cf_7.update();
    cf_8.update();
    cf_9.update();
    cf_10.update();
    cf_11.update();
    cf_12.update();
    cf_13.update();
    cf_14.update();
    */
    render();
}

// Clear the data layer and re-render.
function render() {
    dataLayer.clearLayers();
    dataLayer.addData(dimension.top(Infinity));
}

