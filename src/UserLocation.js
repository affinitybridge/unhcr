// Object that holds user location - adds a layer with user's location marker

var L = require('leaflet'),
    $ = require('jquery'),
    util = require('util'),
    events = require('events');

function UserLocation(map, options) {
    events.EventEmitter.call(this);
    
    // options:
    //   markerStyle - style for point - L.CircleMarker
    //   markerRadius - point radius
    //   circleStyle - style for circle - L.Circle
    var options = $.extend({}, {
        markerStyle: {
            color: '#ff0000',
            fillColor: '#ff0000',
            fillOpacity: 1,
            weight: 2,
            opacity: 1
        },
        markerRadius: 5,
        circleStyle: {
            color: '#136AEC',
            fillColor: '#136AEC',
            fillOpacity: 0.15,
            weight: 2,
            opacity: 0.5
        }
    }, options || {});

    this.map = map;
    this._valid = false;
    this._location = null;
    this._marker = null;
    this._circle = null;
    this._layer = L.layerGroup();

    map.addLayer(this._layer);

    // add the marker/circle to the map or update their position if they exist
    this._updateMarker = function() {
        if(this._circle) {
            this._circle.setLatLng(this._location);
        }
        else {
            this._circle = L.circleMarker(this._location, options.circleStyle).addTo(this._layer);
        }
        if(this._marker) {
            this._marker.setLatLng(this._location);
        }
        else {
            this._marker = L.circle(this._location, options.markerRadius, options.markerStyle).addTo(this._layer);
        }
    };
}

util.inherits(UserLocation, events.EventEmitter);

// set user location - update marker
// l - L.LatLng
UserLocation.prototype.setLocation = function(l) {
    if(!l instanceof L.LatLng) return;
    this._location = L.latLng(l.lat, l.lng);
    this._valid = true;
    this._updateMarker();
    this.emit('user-location-updated', {
        location: this.getLocation()
    })
};

// get user location
// return L.LatLng
UserLocation.prototype.getLocation = function() {
    if(!this._valid) return null;

    return L.latLng(this._location.lat, this._location.lng);
};

// get string representation of user location
// return string
UserLocation.prototype.getLocationString = function() {
    if(!this._valid) return "";

    return this._location.lat+","+this._location.lng;
};

// return true if user location has been set (by gps or manual selection)
UserLocation.prototype.isValid = function() {
    return this._valid;
};

module.exports = UserLocation;
