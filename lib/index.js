// Load modules

var Hoek = require('hoek');
var Lout = require('./lout');
var Endpoints = require('./endpoints');


// Declare internals

var internals = {};


exports.register = function (pack, options, next) {

    Hoek.assert(typeof pack.route === 'function', 'Plugin permissions must allow route');

    options = options || {};
    var docsPath = options.docsPath || '/docs';
    var lout = new Lout(options);

    pack.api({
        generateIndexMarkup: lout.generateIndexMarkup.bind(lout),
        generateRoutesMarkup: lout.generateRoutesMarkup.bind(lout)
    });

    pack.route({ method: 'GET', path: docsPath, config: Endpoints.docs(lout) });

    next();
};