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
// Use Awesome Markers lib to produce font-icon map markers
require('./leaflet.awesome-markers.js');
// Marker clustering
require('../node_modules/leaflet.markercluster/dist/leaflet.markercluster.js');
// File system
var fs = require('fs');

// Initialize the map, using Affinity Bridge's mapbox account.
var map = L.mapbox.map('map', 'affinitybridge.ia7h38nj');

// Initialize the empty layer for the markers, and add it to the map.
var clusterLayer = new L.MarkerClusterGroup({zoomToBoundsOnClick: false, spiderfyDistanceMultiplier: 2}).addTo(map);
// When user clicks on a cluster, zoom directly to its bounds.  If we don't do this,
// they have to click repeatedly to zoom in enough for the cluster to spiderfy.
clusterLayer.on('clusterclick', function (a) {
    // Close any popups that are open already. This helps if we came via "show on map" link,
    // which spawns an unbound popup.
    map.closePopup();
    // If the markers in this cluster are all in the same place, spiderfy on click.
    var bounds = a.layer.getBounds();
    if (bounds._northEast.equals(bounds._southWest)) {
        a.layer.spiderfy();
    } else {
        // If the markers in this cluster are NOT all in the same place, zoom in on them.
        a.layer.zoomToBounds();
    }
});

// Read the polygon file.
// TODO: use these polygons as the basis for a filter/zoom tool
/* Commenting the polygons out for now because they aren't clickable yet
jQuery.getJSON( "src/polygons.json", function( polygonData ) {
    // Create the polygon layer and add to the map.
    var polygonLayer = L.geoJson(polygonData);
    map.addLayer(polygonLayer);
});
*/

// Match possible Activity Categories to Humanitarian Font icons.
var iconGlyphs = {
    'CASH': {glyph: 'ocha-sector-cash', markerColor: '#a48658' },
    'EDUCATION': {glyph: 'ocha-sector-education', markerColor: '#c00000' },
    'FOOD': {glyph: 'ocha-sector-foodsecurity', markerColor: '#006600' },
    'HEALTH': {glyph: 'ocha-sector-health', markerColor: '#08a1d9' },
    'NFI': {glyph: 'ocha-item-reliefgood', markerColor: '#f96a1b' },
    'PROTECTION': {glyph: 'ocha-sector-protection', markerColor: '#1f497d' },
    'SHELTER': {glyph: 'ocha-sector-shelter', markerColor: '#989aac' },
    'WASH': {glyph: 'ocha-sector-wash', markerColor: '#7030a0' }
};
var iconObjects = {};
// Create the icons, as objects named eg iconFOOD.
for (var category in iconGlyphs) {
    iconObjects[category] = L.AwesomeMarkers.icon({
        icon: iconGlyphs[category].glyph,
        prefix: 'icon', // necessary because Humanitarian Fonts prefixes its icon names with "icon"
        iconColor: iconGlyphs[category].markerColor,
        markerColor: "white",
        extraClasses: category
    });
}

// Define the filters
var cf = crossfilter();
var cf_activityName = categoryFilter({
    container: 'activityName',
    type: 'radio',
    key: 'activityName',
    all: true
}, cf);
var cf_referralRequired = categoryFilter({
    container: 'referralRequired',
    type: 'radio',
    key: 'Referral required'
}, cf);
var cf_partnerName = categoryFilter({
    container: 'partnerName',
    type: 'checkbox',
    key: 'partnerName',
}, cf);

// Special meta-dimension for our crossFilter dimensions, used to grab the final set
// of data with all other dimensions' filters applied.
var metaDimension = cf.dimension(function (f) { return f.properties.activityName; });

// Whenever the user changes their selection in the filters, run our update() method.
// Bind the update() method to the "update" event on the category filter.
cf_activityName.on('update', update);
cf_referralRequired.on('update', update);
cf_partnerName.on('update', update);

// This make the "map" span in the map/list toggle look active initially.
$("#mapToggle").addClass("active");

// Show/hide search filters toggler
$(".filter-toggler").click(function(event) {
  var target = this.getAttribute('href');

  event.preventDefault();

  if ($(this).hasClass('active')) {
    $(this).removeClass('active');
    $(target).removeClass('active');
  }
  else {
    $(this)
      .parents('.filter-togglers')
        .find('.active')
          .removeClass('active')
        .end()
      .end()
      .addClass('active');
    $(target)
      .siblings()
        .removeClass('active')
      .end()
      .addClass('active');
  }
});

// List/map view toggler
$("#toggler").click(function() {
  event.preventDefault();
  $("#map").toggle();
  $("#list").toggle();
  $("#mapToggle").toggleClass("active");
  $("#listToggle").toggleClass("active");
});

// When a popup is opened, bind its "show details" link to switch to list view.
map.on('popupopen', function(e){
    var id = e.popup.options.className;
    $("#details-" + id).hide();
    $("#toggler-" + id).click(function() {
        // If the "show details" is clicked, view this item on the list.
        $("#article-" + id).addClass('expand');
        $("#toggler").click();
        $('html, body').animate({
            scrollTop: $("#article-" + id).offset().top
        }, 500);
    });
});

// Get the pre-compiled JSON from the file, and loop through it creating the markers.
jQuery.getJSON( "src/compiled.json", function( data ) {
    $.each( data, function( key, feature ) {

        // Create the marker and add it to the cluster layer.
        var serviceMarker = L.marker(feature.geometry.coordinates.reverse(),
                                     {icon: iconObjects[feature.properties.activityCategory]});
        serviceMarker.addTo(clusterLayer);

        // Make the popup, and bind it to the marker.
        // Add the service ID as a classname; we'll use for the "Show details" link.
        serviceMarker.bindPopup(renderServiceText(feature, "marker"), {className:feature.id});

        // Add the marker we just created back to the feature, so we can re-use the same marker later.
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
    clusterLayer.clearLayers();

    // Initialize the list-view output.
    var listOutput = '<h3 class="hide">Services</h3>';
    var markers = {};

    // Loop through the filtered results, adding the markers back to the map.
    metaDimension.top(Infinity).forEach( function (feature) {
        // Add the filtered markers back to the map's data layer
        clusterLayer.addLayer(feature.properties.marker);
        // TEMP: also add the marker to an array.
        markers[feature.id] = feature.properties.marker;
        // Build the output for the filtered list view
        listOutput += renderServiceText(feature, "list");
    } );

    // Replace the contents of the list div with this new filtered output.
    $('#list').html(listOutput);

    // According functionality for the list
    $(".serviceText > header").click(function(event) {
      event.preventDefault();
      $(this).parent().toggleClass('expand');
    });

    // Bind "show on map" behavior.  Do this here because now the list exists.
    $(".show-on-map").click(function(e) {
        // Get the unique ID of this service.
        var id = e.target.id; 
        // Close any popups that are open already.
        map.closePopup();
        // Fire the toggler click event, to switch to viewing the map.
        $("#toggler").click();
        // Pan and zoom the map.
        map.panTo(markers[id]._latlng);
        if (map.getZoom() < 12) { map.setZoom(12); }
        // Clone the popup for this marker.  We'll show it at the right lat-long, but
        // unbound from the marker.  We do this in case the marker is in a cluster.
        var unboundPopup = markers[id].getPopup();
        // Send the id as the className of the popup, so that the "Show details" binding
        // will work as usual when the popupopen event fires; also, offset the Y
        // position so the popup is a little above the marker or cluster.
        map.openPopup(L.popup({className:id, offset: new L.Point(0,-25)})
            .setLatLng(markers[id]._latlng)
            .setContent(markers[id].getPopup()._content));
    });
}

// Prepare text output for a single item, to show in the map popups or the list view
function renderServiceText(feature, style) {

    // Get the partner logo, if any.
    partnerName = feature.properties.partnerName;
    var logo = partnerName;
    var logoUrl = '/src/images/partner/' + partnerName.toLowerCase().replace(' ', '') + '.jpg';
    var http = new XMLHttpRequest();
    http.open('HEAD', logoUrl, false);
    http.send();
    if (http.status != 404) {
        logo = '<img src="' + logoUrl + '" alt="' + partnerName + '" />';
    }

    // Prepare the office hours output.
    var hours = '<strong>Hours:</strong> ';
    var hourOpen = '';
    var hourClosed = '';
    for (var hoItem in feature.properties["8. Office Open at"]) {
        if (feature.properties["8. Office Open at"][hoItem] === true) {
            hourOpen = hoItem;
        }
    }
    for (var hcItem in feature.properties["9. Office close at"]) {
        if (feature.properties["9. Office close at"][hcItem] === true) {
            hourClosed = hcItem;
        }
    }
    if (hourOpen) {
        // If we have hours, show them as compact as possible.
        hours = hourClosed ?
            hours += hourOpen + ' - ' + hourClosed.replace('Close at', '') :
            hours + 'Open at ' + hourOpen;
    } else {
        // If we have neither an open nor a close time, say "unknown".
        hours = hourClosed ? hours += hourClosed : hours + 'unknown';
    }

    // Create meta-fields for better display of office hours & indicators.
    feature.properties["x. Activity Details"] = feature.properties.indicators;

    // Make an array of the fields we want to show.
    var fields = (style == 'list') ? {
             "x. Activity Details": {'section': 'header'},
             "10. Referral Method": {'section': 'content'},
             "6. Availability": {'section': 'content'},
             "7. Availability Day": {'section': 'content'},
             startDate: {'section': 'content', 'label': 'Start Date'},
             endDate: {'section': 'content', 'label': 'End Date'},
             "1. Registration Type Requirement": {'section': 'content'},
             "2. Nationality": {'section': 'content'},
             "3. Intake Criteria": {'section': 'content'},
             "4. Accessibility": {'section': 'content'},
             "5. Coverage": {'section': 'content'},
             "14. Feedback delay": {'section': 'content'},
             "11. Immediate Next step  response after referal": {'section': 'content'},
             "12. Response delay after referrals": {'section': 'content'},
             "13. Feedback Mechanism": {'section': 'content'}
        }
        : {
             "x. Activity Details": {'section': 'header'},
             "10. Referral Method": {'section': 'header'}
        };

    // Loop through the array, preparing info for the popup.
    var headerOutput = '';
    var contentOutput = '';
    for (var field in fields) {
        // Get the field items (they are all Booleans, we want their labels)
        values = feature.properties[field];
        var output = '';
        // Skip empty fields
        if (values) {
            if (typeof values === 'object') {
                if (Object.getOwnPropertyNames(values).length) {
                    // Strip the leading numeral from the field name.
                    var fieldName = field.substr(field.indexOf(" ") + 1);
                    // Add the field name to the output.
                    output += '<p><strong>' + fieldName + ':</strong> ';
                    // Loop through items, and if value is TRUE, add label to the output.
                    for (var lineItem in values) {
                        if (values[lineItem]) {
                            output += lineItem + ' ';
                        }
                    }
                    output += '</p>';
                }
            } else {
                // If this is one of the fields whose value is a string...
                output += '<p><strong>' + fields[field].label + ':</strong> ' + values;
            }
        }
        if (fields[field].section == 'header') {
            headerOutput += output;
        } else {
            contentOutput += output;
        }
    }

    // Get the activity-category icon.
    activityCategory = feature.properties.activityCategory; // eg "CASH"
    var glyph = '<i class="glyphicon icon-' + iconGlyphs[activityCategory].glyph + '"></i>';

    // In the list view only, the articles must have unique IDs so that we can scroll directly to them
    // when someone clicks the "Show details" link in a map marker.
    var articleID = '';
    var toggleLink = '<a id="toggler-' + feature.id + '" href="#">Show details</a>';
    // If this is for a marker popup, add a "Show details" link that will take us to the list view.
    if (style == 'list') {
        // Whereas if this if for list view, add a link to show this item on the map.
        toggleLink = '<a class="show-on-map" id="' + feature.id + '" href="#">Show on map</a>';
        articleID = ' id="article-' + feature.id + '"';
    }

    // Assemble the article header.
    var header = '<header>' + logo + '<h3>' + glyph + feature.properties.locationName + '</h3>' + '<p class="hours">' + hours + '</p>' + headerOutput + '</header>';

    // Preserve the line breaks in the original comment, but strip extra breaks from beginning and end.
    var comments = feature.properties.comments ?
        feature.properties.comments.trim().replace(/\r\n|\n|\r/g, '<br />') : '';

    // Assemble the article content.
    var content = '<div class="content" id="details-' + feature.id + '">' + contentOutput + '<div class="comments">' + comments + '</div></div>';

    return '<article class="serviceText"' + articleID + '>' + header + toggleLink + content + '</article>';
}

