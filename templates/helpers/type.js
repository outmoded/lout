'use strict';

const Handlebars = require('handlebars');

module.exports = function () {

    let type = this.type;
    if (type === 'object'
        || type === 'alternatives'
        || (type === 'array' && this.items)) {
        type = '';
    }

    if (this.typeIsName || this.root) {
        return new Handlebars.SafeString('<span>&nbsp;</span>');
    }

    return new Handlebars.SafeString(`<span class="field-type">${type}</span>`);
};
