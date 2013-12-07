var Hapi = require('hapi');

var S = Hapi.types.string;

var handler = function (request) {

    request.reply('ok');
};

module.exports = { method: 'GET', path: '/test', config: { handler: handler, validate: { query: { param1: S().required() } } } };
