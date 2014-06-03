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

// Read the polygon file.
// TODO: use these polygons as the basis for a filter/zoom tool
jQuery.getJSON( "src/polygons.json", function( polygonData ) {
    // Create the polygon layer and add to the map.
    var polygonLayer = L.geoJson(polygonData);
    map.addLayer(polygonLayer);
});

// Match possible Activity Categories to Humanitarian Font icons.
var iconGlyphs = [
    {category: 'CASH', glyph: 'ocha-sector-cash', markerColor: '#a48658' },
    {category: 'EDUCATION', glyph: 'ocha-sector-education', markerColor: '#c00000' },
    {category: 'FOOD', glyph: 'ocha-sector-foodsecurity', markerColor: '#006600' },
    {category: 'HEALTH', glyph: 'ocha-sector-health', markerColor: '#08a1d9' },
    {category: 'NFI', glyph: 'ocha-item-reliefgood', markerColor: '#f96a1b' },
    {category: 'PROTECTION', glyph: 'ocha-sector-protection', markerColor: '#1f497d' },
    {category: 'SHELTER', glyph: 'ocha-sector-shelter', markerColor: '#989aac' },
    {category: 'WASH', glyph: 'ocha-sector-wash', markerColor: '#7030a0' }
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
var cf_partnerName = categoryFilter({
    container: 'partnerName',
    type: 'checkbox',
    key: 'partnerName',
    empty: 'No data'
}, cf);

// Special meta-dimension for our crossFilter dimensions, used to grab the final set
// of data with all other dimensions' filters applied.
var metaDimension = cf.dimension(function (f) { return f.properties.activityName; });

// Whenever the user changes their selection in the filters, run our update() method.
// Bind the update() method to the "update" event on the category filter.
cf_activityName.on('update', update);
cf_referralRequired.on('update', update);
cf_partnerName.on('update', update);

// Make the list view hidden by default.
$("#list").hide();
$("#mapToggle").addClass("active"); // This make the "map" span in the map/list toggle look active.

// Make the Advanced Search hidden by default.
$("#advancedFilters").hide();
$("#hideAdvanced").hide();

// Bind list/map view toggle to the toggler link.
// Thus, if user clicks anywhere on the toggler link, the map and list toggle their visibility,
// and the Map and List spans in the toggler link toggle their active-looking-ness.
$("#toggler").click(function() {
    $("#map").toggle();
    $("#list").toggle();
    $("#mapToggle").toggleClass("active");
    $("#listToggle").toggleClass("active");
});
// Bind advanced search filters visibility to the "Advanced Search" link.
$(".advancedToggler").click(function() {
    $("#advancedFilters").toggle();
    $("#showAdvanced").toggle();
    $("#hideAdvanced").toggle();
});

// Get the pre-compiled JSON from the file, and loop through it creating the markers.
jQuery.getJSON( "src/compiled.json", function( data ) {
    $.each( data, function( key, feature ) {

        // Create and add the markers.
        var serviceMarker = L.marker(feature.geometry.coordinates.reverse(),
                                     {icon: iconObjects[feature.properties.activityCategory]});
        serviceMarker.addTo(dataLayer);

        // Make the popup and bind it to the marker.
        serviceMarker.bindPopup(renderServiceText(feature, "teaser"));

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
    cf_partnerName.update();

    // Add the markers to the map.
    render();
}

// Clear the data and re-render.
function render() {
    // Clear all the map markers.
    dataLayer.clearLayers();
    var listOutput = '<h3>Services</h3>'; 
    // Add the filtered markers back to the map data layer.
    metaDimension.top(Infinity).forEach( function (feature) {
        // Add the filtered markers back to the map's data layer
        dataLayer.addLayer(feature.properties.marker); 
        // Build the output for the filtered list view
        listOutput += '<p>' + renderServiceText(feature, "teaser") + '</p>';
    } );
    // Replace the contents of the list div with the new filtered output.
    $('#list').html(listOutput);
}

// Prepare text output for a single item, to show in the map popups or the list view
function renderServiceText(feature, style) {

    // Get the partner logo, if any.
    partnerName = feature.properties.partnerName;
    var logo = partnerName;
    var logoUrl = '/src/images/partner/' + partnerName + '.jpg';
    var http = new XMLHttpRequest();
    http.open('HEAD', logoUrl, false);
    http.send();
    if (http.status != 404) {
        logo = '<img src="' + logoUrl + '" alt="' + partnerName + '" />';
    }

    var headline = '<h3>' + logo + '<br />' + feature.properties.locationName + '</h3>';

    // Preserve the line breaks in the original comment.
    var comments = feature.properties.comments ? feature.properties.comments.replace(/\r\n|\n|\r/g, '<br />') : null;

    // DEBUG: add the unique ID, to see if there are services that were entered in the database more than once.
    comments += '<br /><b>ActivityInfo ID: </b>' + feature.id;

    // Get the info from the accessibility & availability fields.
    var availability = '';

    // Make an array of the fields we want to show.
    var fields = [
        "8. Office Open at",
        "9. Office close at",
        "10. Referral Method",
    ];
    if (style == 'full') {
        fields = jQuery.merge(fields, [
        "6. Availability",
        "7. Availability Day",
        "1. Registration Type Requirement",
        "2. Nationality",
        "3. Intake Criteria",
        "4. Accessibility",
        "5. Coverage"]);
    }

    // Loop through the array, preparing info for the popup.
    for (var i=0, len=fields.length; i < len; i++){
        // Strip the leading numeral from the field name.
        var fieldName = fields[i].substr(fields[i].indexOf(" ") + 1);
        // Add the field name to the output.
        availability += '<br /><b>' + fieldName + ':</b> ';
        // Get the field items (they are all Booleans, we want their labels)
        values = feature.properties[fields[i]];
        // Loop through the items, and if their value is TRUE, add their label to the output.
        for (var lineItem in values) {
            if (values[lineItem]) {
                availability += lineItem + ' ';
            }
        }
    }
    return headline + comments + availability;
}
