'use strict';

var Handlebars = require('handlebars');

module.exports = function () {

    var type = this.type;
    if (type === 'object'
        || type === 'alternatives'
        || (type === 'array' && this.items)) {
        type = '';
    }

    if (this.typeIsName || this.root) {
        return new Handlebars.SafeString('<span>&nbsp;</span>');
    }

    return new Handlebars.SafeString('<span class="field-type">' + type + '</span>');
};
