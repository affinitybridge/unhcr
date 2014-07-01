/* Make the HTML form for the proximity filter. */

var L = require('leaflet');

var ProximityFilterControl = L.Control.extend({

    /* Provides the methods for binding to and triggering events. */
    includes: L.Mixin.Events,

    options: {
        distances: [5, 10, 30, 50]
    },

    initialize: function (options) {
        L.setOptions(this, options);
        this.dimension = this.options.dimension;

        this._distances = this.options.distances;

        this._userLocation = this.options.userLocation;
        this._map = this.options.map;
        this._mapPane = this._map.getPanes()['mapPane'];

        this._numItems = 0;
        this._filter = {
            location: 'all',
            distance: this.options.distances[0]
        };

        this._container = null;
        this._form = null;
        this._locationFieldset = null;
        this._distanceFieldset = null;

        this._userLocationInput = null;
        this._definedLocationInput = null;

        this._initLayout();
        this._initItems();
        this.update();
    },

    container: function () { return this._container; },

    /*
     * This needs to be called whenever the dataset is changed.
     */
    update: function () {

    },

    /* This resets the filters to a nothing-selected state. */
    reset: function () {
        this.dimension.filterAll();
        this.fire('filter', { active: [] });
    },

    /* Set up the form element. */
    _initLayout: function () {
        var class_name = 'leaflet-control-filter',
            container = this._container = L.DomUtil.create('div', class_name);

        if (!L.Browser.touch) {
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(container, 'mousewheel', L.DomEvent.stopPropagation);
        } else {
            L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
        }

        var form = this._form = L.DomUtil.create('form', class_name + '-list');
        var locationFieldset = this._locationFieldset = L.DomUtil.create('fieldset', class_name + '-fieldset');
        var distanceFieldset = this._distanceFieldset = L.DomUtil.create('fieldset', class_name + '-fieldset');

        var locationFieldsetLegend = L.DomUtil.create('legend', class_name + '-fieldset-legend', locationFieldset);
        locationFieldsetLegend.innerHTML = this.options.options.strings.location;

        var distanceFieldsetLegend = L.DomUtil.create('legend', class_name + '-fieldset-legend', distanceFieldset);
        distanceFieldsetLegend.innerHTML = this.options.options.strings.distance;

        form.appendChild(locationFieldset);
        form.appendChild(distanceFieldset);
        container.appendChild(form);
    },

    /*
     * Set up the elements that represent the individual terms we can filter by - ie, the
     * checkboxes and radio buttons.
     */
    _initItems: function () {
        this._initLocations();
        this._initDistances();
    },

    _initLocations: function() {
        this._addItem('location', {
            value: 'all', label: 'All', checked: true
        }, this._locationFieldset);

        this._userLocationInput = this._addItem('location', {
            value: this._userLocation.getLocationString(), label: 'Near to you', checked: false
        }, this._locationFieldset, {
            disabled: !this._userLocation.isValid()
        });

        var self = this;
        this._userLocation.on('user-location-updated', function() {
            self._updateUserLocationInput();
        });

        this._definedLocationInput = this._addItem('location', {
            value: '', label: 'Near a selected location', checked: false
        }, this._locationFieldset, {
            clickCallbackFn: this._selectLocation
        });
    },

    _selectLocation: function() {
        alert('Select a location by clicking on the map');

        L.DomUtil.addClass(this._mapPane, 'pfc-custom-pointer');

        this._map.on('click', this._userLocationSelected, this);
    },

    _userLocationSelected: function(evt) {
        L.DomEvent.stopPropagation(evt);
        L.DomEvent.preventDefault(evt);

        var location = evt.latlng.lat+","+evt.latlng.lng;
        $(this._definedLocationInput).val(location);
        this._filter.location = location;

        this.fire('filter', { filter: this._filter });

        this._deactivateLocationSelect();
    },

    _deactivateLocationSelect: function() {
        L.DomUtil.removeClass(this._mapPane, 'pfc-custom-pointer');

        this._map.off('click', this._userLocationSelected, this);
    },

    _updateUserLocationInput: function(evt) {
        if(this._userLocation.isValid()) {
            var uli = jQuery(this._userLocationInput);
            uli.removeAttr('disabled');
            uli.val(this._userLocation.getLocationString());
        }
    },

    _initDistances: function() {
        this._distances.forEach(function(d, idx) {
            this._addItem('distance', { value: d, label: d+" Km", checked: idx == 0 }, this._distanceFieldset);
        }, this);
    },

    /* Create an individual radio button. */
    _addItem: function (filterName, el, target, opts) {
        var opts = opts || {};

        var label = L.DomUtil.create('label', 'filter-option'),
            input = L.DomUtil.create('input', 'filter-input'),
            name = L.DomUtil.create('span', 'filter-label-value');

        input.name = 'filter-'+filterName;
        input.className = 'leaflet-control-filter-selector';
        input.value = el.value;
        input.type = 'radio';

        if(opts.hasOwnProperty('clickCallbackFn')) {
            var fn = opts['clickCallbackFn'];
            L.DomEvent.on(input, 'click', fn, this);
        }
        else {
            L.DomEvent.on(input, 'click', function (evt) {
                this._onInputClick(filterName, evt.target);
            }, this);
        }

        if(el.checked) input.checked = "checked";
        if(opts.hasOwnProperty('disabled')) input.disabled = "disabled";

        label.id = 'location-filter-value-' + el.value;

        name.innerHTML = el.label;

        label.appendChild(input);
        label.appendChild(name);

        target.appendChild(label);

        return input;
    },

    _onInputClick: function(filterName, el) {
        this._filter[filterName] = el.value;

        this.fire('filter', { filter: this._filter });
    }
});

var proximityFilterControl = function(options) {
    return new ProximityFilterControl(options);
};

/*
 * Module interface.
 * Params:
 * - "options" object with the following properties:
 *   - container (HTML element to contain this filter)
 *   - key (identifies this filter)
 *   - empty (optional - items with no value for this filter group under this)
 * - cf: a crossfilter instance, which is used to create a dimension
 */
module.exports = proximityFilterControl;
