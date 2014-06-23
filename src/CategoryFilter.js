/*
 * Create filters that filter a dataset based on category-like terms.
 */

// Require some libs.
var jQuery = require('jquery'),
    BaseFilter = require('./BaseFilter'),
    filterControl = require('./FilterControl');

var CategoryFilter = BaseFilter.extend({
    /* Constructor takes the following params:
      dimension - a CrossFilter dimension
      container - an HTML container element for the filter form
      options - contains type - either radio ("AND" filter) or checkbox ("OR" filter)
    */
    initialize: function (dimension, container, options) {

        if (options && dimension ) {
            if (!container) { container = document.getElementById(options.container); }

            this._filter = filterControl({ dimension: dimension, type: options.type, options: options });

            this._filter.on('filter', function (e) {
                dimension.filterAll();
                dimension.filter(function (f) {
                    return e.active.length === 0 ? true : jQuery.inArray(f, e.active) >= 0;
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
module.exports = function (options, cf) {
    var container = document.getElementById(options.container),
        dimension = cf.dimension(function (f) { return f.properties[options.key] || options.empty; });

    return new CategoryFilter(dimension, container, options);
};
