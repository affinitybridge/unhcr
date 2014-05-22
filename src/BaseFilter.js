var L = require('leaflet');

var BaseFilter = L.Class.extend({
    includes: L.Mixin.Events,

    render: function () {
        this.fire('update');
    },

    update: function () {},

    reset: function () {}
});

module.exports = BaseFilter;
