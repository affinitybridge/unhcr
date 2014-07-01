// Require some libs.
var jQuery = require('jquery'),
    BaseFilter = require('./BaseFilter'),
    regionFilterControl = require('./RegionFilterControl')
    gju = require('geojson-utils');

var RegionFilter = BaseFilter.extend({
    /*

     Constructor takes the following params:
     dimension - a CrossFilter dimension
     container - an HTML container element for the filter form
     options - contains type - either radio ("AND" filter) or checkbox ("OR" filter)

     */
    initialize: function (dimension, container, map, opts) {
        var options = jQuery.extend({}, {

        }, opts);

        if (options && dimension ) {
            if (!container) { container = document.getElementById(options.container); }
            this._filter = regionFilterControl({
                dimension: dimension,
                map: map,
                type: options.type,
                regionsLayer: options.regionsLayer,
                nameProperty: options.nameProperty,
                options: options
            });

            this._regionsLayer = options.regionsLayer;

            this._filter.on('filter', function (e) {
                dimension.filterAll();

                var features = [];
                e.active.forEach(function(fid) {
                    features.push(this._regionsLayer.getLayer(fid));
                }, this);

                // hide points if they are not in geojson polygon
                dimension.filter(function (p) {
                    if(e.active.length === 0) return true;

                    var pp = p.split(',');
                    var point = {
                        type: "Point",
                        coordinates: [parseFloat(pp[1]), parseFloat(pp[0])]
                    };

                    var found = false, i = 0;
                    while(!found && i < features.length) {
                        found = gju.pointInPolygon(point, features[i].toGeoJSON().geometry);
                        i++;
                    }
                    return found;
                });
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
var regionFilter = function(options, cf) {
    var container = document.getElementById(options.container),
        dimension = cf.dimension(function (f) {
            return f.geometry.coordinates[0]+","+f.geometry.coordinates[1] || "";
        }),
        map = options.map;
    return new RegionFilter(dimension, container, map, options);
};

module.exports = regionFilter;