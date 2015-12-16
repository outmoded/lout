'use strict';

const Handlebars = require('handlebars');

module.exports = function (isAlternative) {

    if (isAlternative || this.root) {
        return new Handlebars.SafeString('<span>&nbsp;</span>');
    }

    let type = this.type;
    if (type === 'object'
        || type === 'alternatives'
        || (type === 'array' && this.items)) {
        type = '';
    }

    if (this.allowedValues) {
        if (!this.name || this.allowedValues.length === 1) {
            // Used for array and alternatives rendering
            type = this.allowedValues;
        }
        else {
            type = `<span class="text-danger">one of</span> <span>${this.allowedValues.join(', ')}</span>`;
        }
    }

    return new Handlebars.SafeString(`<span class="field-type">${type}</span>`);
};
