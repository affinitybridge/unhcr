// Custom control - User can select a point to define his position
// Fires a user-location-selected event on map

var L = require('leaflet');

L.Control.SelectUserLocation = L.Control.extend({
    options: {
        position: 'topleft',
        icon: 'sulc-icon-location',
        strings: {
            title: "Set your current location"
        }
    },

    onAdd: function (map) {
        // control container
        var container = L.DomUtil.create('div',
            'leaflet-control-setuserlocation leaflet-bar leaflet-control');

        // map reference
        this._map = map;

        // map pane reference
        this._mapPane = map.getPanes()['mapPane'];

        this._active = false;

        // Construct the toggle link
        this._link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single ' + this.options.icon, container);
        this._link.href = 'javascript:void(0);';
        this._link.title = this.options.strings.title;

        // bind link click event
        L.DomEvent
            .on(this._link, 'click', L.DomEvent.stopPropagation)
            .on(this._link, 'click', L.DomEvent.preventDefault)
            .on(this._link, 'click', function() {
                this._toggleUserLocationSelection();
            }, this)
            .on(this._link, 'dblclick', L.DomEvent.stopPropagation)
            .on(this._link, 'dblclick', L.DomEvent.preventDefault);

        return container;
    },

    // activate / deactivate user's location selection
    _toggleUserLocationSelection: function() {
        this._active ? this._deactivateUserLocationSelection() : this._activateUserLocationSelection();
    },

    // deactivate user's location selection
    _deactivateUserLocationSelection: function() {
        this._map.off('click', this._userLocationSelected, this);

        L.DomUtil.removeClass(this._link, 'sulc-icon-toggled');

        L.DomUtil.removeClass(this._mapPane, 'sulc-custom-pointer');

        this._active = false;
    },

    // activate user's location selection
    _activateUserLocationSelection: function() {
        this._map.on('click', this._userLocationSelected, this);

        L.DomUtil.addClass(this._link, 'sulc-icon-toggled');

        L.DomUtil.addClass(this._mapPane, 'sulc-custom-pointer');

        this._active = true;
    },

    // when user select a location, fires an 'user-location-selected' event with selected
    // latitude / longitude
    _userLocationSelected: function(evt) {
        L.DomEvent.stopPropagation(evt);
        L.DomEvent.preventDefault(evt);

        this._deactivateUserLocationSelection();

        this._map.fire('user-location-selected', {
            latlng: evt.latlng
        });
    }
});

L.Map.addInitHook(function () {
    if (this.options.selectUserLocationControl) {
        this.selectUserLocationControl = L.control.selectUserLocation();
        this.addControl(this.selectUserLocationControl);
    }
});

L.control.selectUserLocation = function (options) {
    return new L.Control.SelectUserLocation(options);
};