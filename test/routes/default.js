var Hapi = require('hapi');

var S = Hapi.types.string;
var O = Hapi.types.object;
var A = Hapi.types.array;
var N = Hapi.types.number;

var handler = function (request) {

    request.reply('ok');
};

module.exports = [
    { method: 'GET', path: '/test', config: { handler: handler, validate: { query: { param1: S().required() } }, tags: ['admin', 'api'], description: 'Test GET', notes: 'test note' } },
    { method: 'GET', path: '/another/test', config: { handler: handler, validate: { query: { param1: S().required() } } } },
    { method: 'GET', path: '/zanother/test', config: { handler: handler, validate: { query: { param1: S().required() } } } },
    { method: 'POST', path: '/test', config: { handler: handler, validate: { query: { param2: S().valid('first', 'last') } } } },
    { method: 'DELETE', path: '/test', config: { handler: handler, validate: { query: { param2: S().valid('first', 'last') } } } },
    { method: 'PUT', path: '/test', config: { handler: handler, validate: { query: { param2: S().valid('first', 'last') } } } },
    { method: 'HEAD', path: '/test', config: { handler: handler, validate: { query: { param2: S().valid('first', 'last') } } } },
    { method: 'GET', path: '/notincluded', config: { handler: handler, plugins: { lout: false } } },
    { method: 'GET', path: '/nested', config: { handler: handler, validate: { query: { param1: O({ nestedparam1: S().required() }) } } } },
    { method: 'GET', path: '/rootobject', config: { handler: handler, validate: { query: O({ param1: S().required() }) } } },
    { method: 'GET', path: '/rootarray', config: { handler: handler, validate: { query: A().includes(S(), O({ param1: N() })).excludes(N()) } } },
    { method: 'GET', path: '/path/{pparam}/test', config: { handler: handler, validate: { path: { pparam: S().required() } } } },
    { method: 'GET', path: '/emptyobject', config: { handler: handler, validate: { query: { param1: O() } } } }
];
