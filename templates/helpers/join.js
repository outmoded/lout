'use strict';

const Handlebars = require('handlebars');

module.exports = function (context) {

    return new Handlebars.SafeString(context.join(', '));
};
