// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
Hapi.joi.version('v2');

// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;
var S = Hapi.types.string;
var O = Hapi.types.object;
var A = Hapi.types.array;

describe('Lout', function () {

    var server = null;
    before(function (done) {

        server = new Hapi.Server();

        var handler = function (request) {

            request.reply('ok');
        };

        server.route([
            { method: 'GET', path: '/test', config: { handler: handler, validate: { query: { param1: S().required() } } } },
            { method: 'GET', path: '/another/test', config: { handler: handler, validate: { query: { param1: S().required() } } } },
            { method: 'GET', path: '/zanother/test', config: { handler: handler, validate: { query: { param1: S().required() } } } },
            { method: 'POST', path: '/test', config: { handler: handler, validate: { query: { param2: S().valid('first', 'last') } } } },
            { method: 'GET', path: '/notincluded', config: { handler: handler, plugins: { lout: false } } },
            { method: 'GET', path: '/nested', config: { handler: handler, validate: { query: { param1: O({ nestedparam1: S().required() }) } } } },
            { method: 'GET', path: '/rootobject', config: { handler: handler, validate: { query: O({ param1: S().required() }) } } },
            { method: 'GET', path: '/rootarray', config: { handler: handler, validate: { query: A().includes(S()) } } }
        ]);

        server.pack.require('../', function () {

            done();
        });
    });

    it('shows template when correct path is provided', function (done) {

        server.inject('/docs?path=/test', function (res) {

            expect(res.result).to.contain('GET: /test');
            expect(res.result).to.contain('POST: /test');
            done();
        });
    });

    it('returns a Not Found response when wrong path is provided', function (done) {

        server.inject('/docs?path=blah', function (res) {

            expect(res.result.error).to.equal('Not Found');
            done();
        });
    });

    it('displays the index if no path is provided', function (done) {

        server.inject('/docs', function (res) {

            server.routingTable().forEach(function (route) {
                if ((route.settings.plugins && route.settings.plugins.lout === false) || route.path === '/docs') {
                    expect(res.result).to.not.contain('?path=' + route.path);
                } else {
                    expect(res.result).to.contain('?path=' + route.path);
                }
            });
            done();
        });
    });

    it('index doesn\'t have the docs endpoint listed', function (done) {

        server.inject('/docs', function (res) {

            expect(res.result).to.not.contain('/docs');
            done();
        });
    });

    it('index doesn\'t include routes that are configured with docs disabled', function (done) {

        server.inject('/docs', function (res) {

            expect(res.result).to.not.contain('/notincluded');
            done();
        });
    });

    it('displays nested rules', function (done) {
        server.inject('/docs?path=/nested', function (res) {
            expect(res.result).to.contain('param1');
            expect(res.result).to.contain('nestedparam1');
            expect(res.result).to.contain('icon-star');
            done();
        });
    });

    describe('Index', function () {

        it('doesn\'t throw an error when requesting the index when there are no POST routes', function (done) {

            var server = new Hapi.Server();
            server.route({ method: 'GET', path: '/test', config: { handler: function (request) { request.reply('ok'); }, validate: { query: { param1: S().required() } } } });

            server.pack.require('../', function () {

                server.inject('/docs', function (res) {

                    expect(res).to.exist;
                    expect(res.result).to.contain('/test');
                    done();
                });
            });
        });
    });
});
