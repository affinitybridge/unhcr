// Amani.FilterFactory.include({
//     category: function (options, cf, data) {
//         var container = document.getElementById(options.container),
//             dimension = cf.dimension(function (f) { return f.properties[options.key] || options.empty; });
// 
//         return new Amani.CategoryFilter(dimension, container, options);
//     }
// });

// Require some libs.
var jQuery = require('jquery'),
    BaseFilter = require('./BaseFilter'),
    filterControl = require('./FilterControl');

var CategoryFilter = BaseFilter.extend({
    initialize: function (dimension, container, options) {

        if (!container) { container = document.getElementById(options.container); }

        this._filter = filterControl({ dimension: dimension, type: options.type });

        this._filter.on('filter', function (e) {
            dimension.filterAll();
            dimension.filter(function (f) {
                return e.active.length === 0 ? true : jQuery.inArray(f, e.active) >= 0;
            });
            this.render();
        }, this);

        container.appendChild(this._filter.container());
    },

    update: function () {
        this._filter.update();
    },

    reset: function () {
        this._filter.reset();
    }
});

module.exports = function (options, cf) {
    var container = document.getElementById(options.container),
        dimension = cf.dimension(function (f) { return f.properties[options.key] || options.empty; });

    return new CategoryFilter(dimension, container, options);
};
