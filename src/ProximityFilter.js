// Require some libs.
var jQuery = require('jquery'),
    BaseFilter = require('./BaseFilter'),
    proximityFilterControl = require('./ProximityFilterControl');

var ProximityFilter = BaseFilter.extend({
    /*

    Constructor takes the following params:
    dimension - a CrossFilter dimension
    container - an HTML container element for the filter form
    options - contains type - either radio ("AND" filter) or checkbox ("OR" filter)

    */
    initialize: function (dimension, container, map, userLocation, opts) {
        var options = jQuery.extend({}, {
            strings: {
                location: "Location",
                distance: "Distance"
            }
        }, opts);

        if (options && dimension ) {
            if (!container) { container = document.getElementById(options.container); }

            this._filter = proximityFilterControl({ dimension: dimension, map: map, userLocation: userLocation, options: options });
            this._filter.on('filter', function (e) {
                dimension.filterAll();

                var filter = e.filter;

                if(filter.location != 'all') {
                    var origin = L.latLng(filter.location.split(','));
                    dimension.filterFunction(function (l) {
                        return origin.distanceTo(L.latLng(l.split(','))) <= filter.distance * 1000;
                    });
                }
                this.render();
            }, this);

            container.appendChild(this._filter.container());
        }
    },

    /*
     * This needs to be called whenever the dataset is changed by something
     * outside of this file.
     */
    update: function () {
        this._filter.update();
    },

    /* Calling this will reset the filters to a nothing-selected state. */
    reset: function () {
        this._filter.reset();
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
var proximityFilter = function(options, cf) {
    var container = document.getElementById(options.container),
        dimension = cf.dimension(function (f) {
            return f.geometry.coordinates[0]+","+f.geometry.coordinates[1] || "";
        }),
        map = options.map,
        userLocation = options.userLocation;
    return new ProximityFilter(dimension, container, map, userLocation, options);
};

module.exports = proximityFilter;