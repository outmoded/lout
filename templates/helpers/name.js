'use strict';

const Handlebars = require('handlebars');

module.exports = function () {

    if (this.name) {
        return new Handlebars.SafeString(this.name);
    }

    if (this.allowedValues && this.allowedValues.length > 1) {
        return new Handlebars.SafeString('<span class="text-danger">one of</span>');
    }
};
