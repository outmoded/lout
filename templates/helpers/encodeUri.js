'use strict';

const Handlebars = require('handlebars');

module.exports = function (uri) {

    return new Handlebars.SafeString(encodeURI(uri));
};
