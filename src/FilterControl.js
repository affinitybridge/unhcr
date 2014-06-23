/* Make the HTML form for the filters. */

var L = require('leaflet');

var FilterControl = L.Control.extend({

    /* Provides the methods for binding to and triggering events. */
    includes: L.Mixin.Events,

    options: {
        type: 'checkbox'
    },

    initialize: function (options) {
        L.setOptions(this, options);
        this.dimension = this.options.dimension;
        this.options = this.options;

        this._numItems = 0;
        this.filters = {};

        this._initLayout();
        this._initItems();
        this.update();
    },

    container: function () { return this._container; },

    /*
     * This needs to be called whenever the dataset is changed.
     */
    update: function () {
        var group = this.dimension.group(),
            filteredData = group.all();

        if (!filteredData.length && !this._numItems) {
            return;
        }

        this._initItems();

        if (this.options.type === 'radio') {
            var label = this.filters.All;

            if (filteredData.length) {
                label.children[1].innerHTML = this._label(filteredData.reduce(function (p, c) {
                    return { key: "All", value: p.value + c.value };
                }), true);
            }
        }
        filteredData.forEach(function (item) {
            var label = this.filters[item.key];
            label.children[1].innerHTML = this._label(item);
        }, this);
    },

    /* This resets the filters to a nothing-selected state. */
    reset: function () {
        var inputs = this._form.getElementsByTagName('input');
        for (var i = 0, len = inputs.length; i < len; i++) {
            inputs[i].checked = null;
        }
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

        container.appendChild(form);
    },

    /*
     * Set up the elements that represent the individual terms we can filter by - ie, the
     * checkboxes and radio buttons.
     */
    _initItems: function () {
        var group = this.dimension.group(),
            filteredData = group.all();

        if (this.options.type === 'radio' && filteredData.length && !this.filters.All) {
            this.filters.All = this._addItem(filteredData.reduce(function (p, c) {
                return { key: "All", value: p.value + c.value };
            }), true);
        }

        filteredData.forEach(function (item) {
            if (!this.filters[item.key]) {
                this._numItems++;
                this.filters[item.key] = this._addItem(item);
            }
        }, this);
    },

    /* Create an individual checkbox or radio button. */
    _addItem: function (filter, checked) {
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

        input.className = 'leaflet-control-filter-selector';
        input.value = filter.key;
        label.id = (this.options.options.key + '-filter-value-' + filter.key).replace(/[\W_\s]/g, '-').toLowerCase();

        L.DomEvent.on(input, 'click', this._onInputClick, this);

        var name = L.DomUtil.create('span', 'filter-label-value');

        // Add a space for a logo or symbol.  TODO: move this into index.js.
        var glyph = L.DomUtil.create('span', 'glyph');

        name.innerHTML = this._label(filter);

        label.appendChild(input);
        label.appendChild(name);
        label.appendChild(glyph);

        this._form.appendChild(label);

        return label;
    },

    /* Make the label for each checkbox or radio button, with a result count.  */
    _label: function (item) {
        // return item.key;
        // TODO: Fix filter count values updating.
        return ' ' + item.key + ' (' + item.value + ')';
    },

    /* Handle click event on a checkbox or radio button. */
    _onInputClick: function () {
        var i, len, input,
            active_filters = [],
            inputs = this._form.getElementsByTagName('input');

        for (i = 0, len = inputs.length; i < len; i++) {
            input = inputs[i];
            if (input.checked && input.value !== 'All') active_filters.push(input.value);
        }

        this.fire('filter', { active: active_filters });
    }
});

/*
 * Module interface.
 * Params:
 * - "options" object with the following properties:
 *   - container (HTML element to contain this filter)
 *   - key (identifies this filter)
 *   - empty (optional - items with no value for this filter group under this)
 * - cf: a crossfilter instance, which is used to create a dimension
 */
module.exports = function (options) {
    return new FilterControl(options);
};
