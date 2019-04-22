'use strict';

const Handlebars = require('handlebars');

module.exports = function (isAlternative) {

    if (isAlternative ||
        this.root) {

        return new Handlebars.SafeString('<span>&nbsp;</span>');
    }

    let type = this.type;
    if (type === 'object' ||
        type === 'alternatives' ||
        (type === 'array' && this.items)) {

        type = '';
    }

    if (this.allowedValues) {
        // Used for array and alternatives rendering
        if (!this.name) {
            type = this.allowedValues.join(', ');
        }

        // with only one `.valid()`, just show that, it's the only possiblity
        else if (this.flags &&
            this.flags.allowOnly &&
            this.allowedValues.length === 1) {

            type = this.allowedValues[0];
        }

        // with multiple `.valid()` values, delcare it must be one of those
        else if (this.flags &&
            this.flags.allowOnly) {

            type = `<span class="text-danger">must be one of</span> <span>${this.allowedValues.join(', ')}</span>`;
        }

        // if there's a single allowedValue and it's not required
        else if (this.allowedValues.length === 1) {
            type += ` (<span class="text-danger">can also be</span> <span>${this.allowedValues[0]}</span>)`;
        }

        // if there's allowedValues, but they're not required
        else {
            type += ` (<span class="text-danger">can also be one of</span> <span>${this.allowedValues.join(', ')}</span>)`;
        }
    }

    return new Handlebars.SafeString(`<span class="field-type">${type.trim()}</span>`);
};
