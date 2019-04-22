'use strict';

// Helper to check for at least one truthy object in a list

module.exports = function (...args) {

    const options = args.slice(-1)[0];
    const conditions = args.slice(0, -1);

    return conditions.some((v) => v) ? options.fn(this) : options.inverse(this);
};
