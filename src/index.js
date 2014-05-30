/*
 * This is the main file where we program the application JS. This code is then
 * processed through Browserify to protect namespace.
 */

// Require some libs. 
var $ = require('jquery'),
    crossfilter = require('crossfilter'),
    console = require('console'),
    categoryFilter = require("./CategoryFilter");
// Mapbox doesn't need its own var - it automatically attaches to Leaflet's L.
require('mapbox.js');
// Awesome Markers needs to be referred to by file path, because it's not in the build.
// TODO: make Awesome Markers be properly part of the package, so it downloads automatically.
require('./leaflet.awesome-markers.js');
var fs = require('fs');

// Initialize the map, using Affinity Bridge's mapbox account.
var map = L.mapbox.map('map', 'affinitybridge.ia7h38nj');

// Add the data layer to the map.
var dataLayer = L.featureGroup().addTo(map);

// Match possible Activity Categories to Humanitarian Font icons.
var iconGlyphs = [
    {category: 'CASH', glyph: 'money', markerColor: '#c00000' },
    {category: 'EDUCATION', glyph: 'ocha-sector-education', markerColor: '#31859c' },
    {category: 'FOOD', glyph: 'food', markerColor: '#948a54' },
    {category: 'HEALTH', glyph: 'medkit', markerColor: '#43b305' },
    {category: 'NFI', glyph: 'ocha-sector-livelihood', markerColor: '#026cb6' },
    {category: 'PROTECTION', glyph: 'ocha-sector-protection', markerColor: '#1f4981' },
    {category: 'SHELTER', glyph: 'home', markerColor: '#ffc000' },
    {category: 'WASH', glyph: 'ocha-sector-wash', markerColor: '#8064a2' }
];
var iconObjects = {};
// Create the icons, as objects named eg iconFOOD.
for (var i=0, len=iconGlyphs.length; i < len; i++){
    iconObjects[iconGlyphs[i].category] = L.AwesomeMarkers.icon({
        icon: iconGlyphs[i].glyph,
        prefix: 'icon', // necessary because Humanitarian Fonts prefixes its icon names with "icon"
        iconColor: iconGlyphs[i].markerColor,
        markerColor: "white",
        extraClasses: iconGlyphs[i].category
    });
}


// Define the filters
var cf = crossfilter();
var cf_activityName = categoryFilter({
    container: 'activityName',
    type: 'radio',
    key: 'activityName',
    empty: 'No data'
}, cf);
var cf_referralRequired = categoryFilter({
    container: 'referralRequired',
    type: 'radio',
    key: 'Referral required',
    empty: 'No data'
}, cf);

// Special meta-dimension for our crossFilter dimensions, used to grab the final set
// of data with all other dimensions' filters applied.
var metaDimension = cf.dimension(function (f) { return f.properties.activityName; });

// Whenever the user changes their selection in the filters, run our update() method.
// Bind the update() method to the "update" event on the category filter.
cf_activityName.on('update', update);
cf_referralRequired.on('update', update);

// Get the pre-compiled JSON from the file, and loop through it creating markers.
jQuery.getJSON( "src/compiled.json", function( data ) {
    $.each( data, function( key, feature ) {

        // Create and add the markers.
        var serviceMarker = L.marker(feature.geometry.coordinates.reverse(),
                                     {icon: iconObjects[feature.properties.activityCategory]});
        serviceMarker.addTo(dataLayer);

        // Add the info popups.
        var locationName = '<h3>' + feature.properties.locationName + '</h3>';

        // Preserve the line breaks in the original comment.
        var comments = feature.properties.comments ? feature.properties.comments.replace(/\r\n|\n|\r/g, '<br />') : null;

        // Get the info from the accessibility & availability fields.
        var availability = '';
        // Make an array of the fields we want to show in the popup.
        var popupFields = [
            "8. Office Open at",
            "9. Office close at",
            "6. Availability",
            "7. Availability Day",
            "10. Referral Method",
            "1. Registration Type Requirement",
            "2. Nationality",
            "3. Intake Criteria",
            "4. Accessibility",
            "5. Coverage"
        ];
        // Loop through the array.
        for (var i=0, len=popupFields.length; i < len; i++){
            // Strip the leading numeral from the field name.
            var fieldName = popupFields[i].substr(popupFields[i].indexOf(" ") + 1); 
            // Add the field name to the output.
            availability += '<br /><b>' + fieldName + ':</b> ';
            // Get the field items (they are all Booleans, we want their labels)
            values = feature.properties[popupFields[i]];
            // Loop through the items, and if their value is TRUE, add their label to the output.
            for (var lineItem in values) {
                if (values[lineItem]) {
                    availability += lineItem + ' ';
                }
            } 
        }

        // Make the popup and bind it to the marker.
        serviceMarker.bindPopup(locationName + comments + availability);

        // Add the marker layer we just created to "feature"
        feature.properties.marker = serviceMarker;
    });

    // Add the new data to the crossfilter
    cf.add(data);

    // Add the markers to the map
    update();

});


// Functions...

// Update the markers and filters based on the user's filter input.
function update() {
    // Update the filters.
    cf_activityName.update();
    cf_referralRequired.update();

    // Add the markers to the map.
    render();
}

// Clear the data layer and re-render.
function render() {
    dataLayer.clearLayers();
    metaDimension.top(Infinity).forEach( function (feature) {
      dataLayer.addLayer(feature.properties.marker); 
    } );
}

