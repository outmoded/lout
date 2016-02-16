'use strict';

const Handlebars = require('handlebars');

module.exports = function (context) {

    return new Handlebars.SafeString(JSON.stringify(context, null, 2).replace(/(\r\n|\n|\r)/gm, '<br>'));
};
