/* Make the HTML form for the region filter. */

var L = require('leaflet');

var RegionFilterControl = L.Control.extend({

    /* Provides the methods for binding to and triggering events. */
    includes: L.Mixin.Events,

    options: {
    },

    initialize: function (options) {
        L.setOptions(this, options);
        this.dimension = this.options.dimension;

        this._map = this.options.map;
        this._regionsLayer = this.options.regionsLayer;
        this._nameProperty = this.options.nameProperty;
        this._numItems = 0;

        this._filters = {};
        this._activeFilters = [];

        this._container = null;
        this._form = null;

        this._initLayout();
        this._initItems();
        this.update();
    },

    container: function () { return this._container; },

    /*
     * This needs to be called whenever the dataset is changed.
     */
    update: function () {
        this._initItems();
    },

    /* This resets the filters to a nothing-selected state. */
    reset: function () {
        this.dimension.filterAll();
        this.fire('filter', { active: [] });
        this._resetActiveFilters();
    },

    /* reset active filters */
    _resetActiveFilters: function() {
        this._activeFilters = [];
        this._resetFeaturesOpacity();
    },

    /* set opacity to initial state for all features */
    _resetFeaturesOpacity: function() {
        this._regionsLayer.getLayers().forEach(function(f) {
            f.setStyle({
                opacity: 0.3
            });
        }, this);
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

        container.appendChild(form);
    },

    /*
     * Set up the elements that represent the individual terms we can filter by - ie, the
     * checkboxes and radio buttons.
     */
    _initItems: function () {
        if (this.options.type === 'radio' && this.options.options.all && !this._filters['all']) {
            this._filters["all"] = this._addItem('all');
        }

        this._regionsLayer.getLayers().forEach(function(f) {
            f.setStyle({
                opacity: 0.3
            });

            L.DomEvent.addListener(f, 'mouseover', function(e) {
                if(this._activeFilters.indexOf(this._regionsLayer.getLayerId(e.target)) < 0) {
                    e.target.setStyle({
                        opacity: 0.5
                    });
                }
            }, this);

            L.DomEvent.addListener(f, 'mouseout', function(e) {
                if(this._activeFilters.indexOf(this._regionsLayer.getLayerId(e.target)) < 0) {
                    e.target.setStyle({
                        opacity: 0.3
                    });
                }
            }, this);

            L.DomEvent.addListener(f, 'click', this._onFeatureClick, this);

            var key = this._getFeatureId(f);
            if (!this._filters[key]) {
                this._numItems++;
                this._filters[key] = this._addItem(f);
            }
        }, this);
    },

    _getFeatureName: function(f) {
        return f.feature.properties[this._nameProperty];
    },

    _getFeatureId: function(f) {
        return this._regionsLayer.getLayerId(f);
    },

    /* Create an individual radio or checkbox button. */
    _addItem: function (feature, checked) {
        var type = this.options.type,
            label = L.DomUtil.create('label', 'filter-option'),
            input = L.DomUtil.create('input', 'filter-input');

        checked = (checked || false);

        if (jQuery.inArray(type, ['checkbox', 'radio']) >= 0) {
            input.type = type;
            if (type === 'radio') {
                input.name = 'filter-' + L.Util.stamp(this);
            }
            if (checked) input.checked = 'checked';
        }
        else {
            throw new Error('Invalid filter type: ' + this.options.type);
        }

        var id = feature === "all" ? "all" : this._getFeatureId(feature);

        input.className = 'leaflet-control-filter-selector';
        input.value = id;
        label.id = this._labelId(id);

        L.DomEvent.on(input, 'click', this._onInputClick, this);

        var name = L.DomUtil.create('span', 'filter-label-value');

        name.innerHTML = feature === "all" ? "All" : this._getFeatureName(feature);

        label.appendChild(input);
        label.appendChild(name);

        this._form.appendChild(label);

        return label;
    },

    _labelId: function(id) {
        return (this.options.options.key + '-filter-value-' + id).replace(/[\W_\s]/g, '-').toLowerCase();
    },

    /* feature click handler - updates active filters and checkboxes / radios */
    _onFeatureClick: function(e) {
        var type = this.options.type;

        if(type == "radio") this._resetActiveFilters();

        var id = this._getFeatureId(e.target);

        var input = L.DomUtil.get(this._labelId(id)).getElementsByTagName("input")[0];

        var idx = this._activeFilters.indexOf(id);

        if(idx < 0) {
            e.target.setStyle({
                opacity: 0.7
            });
            input.checked = 'checked';

            this._activeFilters.push(id);
        }
        else {
            e.target.setStyle({
                opacity: 0.3
            });

            input.checked = false;

            this._activeFilters.splice(idx, 1);
        }

        this.fire('filter', { active: this._activeFilters });
    },

    /* input click handler - updates active filters and features */
    _onInputClick: function(evt) {
        var type = this.options.type;

        var input = evt.target;

        if (input.value === 'all') {
            this._resetActiveFilters();
        }
        else {
            if(type == "radio") {
                this._resetActiveFilters();
            }

            var f = this._regionsLayer.getLayer(input.value);
            if (input.checked) {
                this._activeFilters.push(input.value);
                f.setStyle({
                    opacity: 0.7
                });
            }
            else {
                var idx = this._activeFilters.indexOf(input.value) > -1;
                if(idx > -1) {
                    this._activeFilters.splice(idx, 1);
                    f.setStyle({
                        opacity: 0.3
                    });
                }
            }
        }

        this.fire('filter', { active: this._activeFilters });
    }
});

var regionFilterControl = function(options) {
    return new RegionFilterControl(options);
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
module.exports = regionFilterControl;
