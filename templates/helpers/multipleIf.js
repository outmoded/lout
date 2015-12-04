'use strict';

// Helper to check for at least one truthy object in a list
module.exports = function () {

    const options = Array.prototype.slice.call(arguments, -1)[0];
    const conditions = Array.prototype.slice.call(arguments, 0, -1);

    return conditions.some((v) => v) ? options.fn(this) : options.inverse(this);
};
