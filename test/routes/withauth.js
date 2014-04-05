var Hapi = require('hapi');

var handler = function (request) {

    request.reply('ok');
};

module.exports = { method: 'GET', path: '/withauth', config: { handler: handler, auth: true } };
