'use strict';

const Handlebars = require('handlebars');

module.exports = function (context) {

    const stringified = typeof context === 'function' && context.description ?
      context.description :
      JSON.stringify(context, null, 2).replace(/(\r\n|\n|\r)/gm, '<br>');

    return new Handlebars.SafeString(stringified);
};
