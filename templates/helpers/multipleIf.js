'use strict';

// Helper to check for at least one truthy object in a list
module.exports = function() {

    var options = Array.prototype.slice.call(arguments, -1)[0];
    var conditions = Array.prototype.slice.call(arguments, 0, -1);

    if (conditions.some(function(v) {
        return v;
    })) {

        return options.fn(this);
    }

    return options.inverse(this);
};
