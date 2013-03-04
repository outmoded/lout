// Load modules

var Chai = require('chai');
var Hapi = require('hapi');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Chai.expect;
var S = Hapi.types.String;


describe('Docs Generator', function () {

    var routeTemplate = '{{#each routes}}{{this.method}}|{{/each}}';
    var indexTemplate = '{{#each routes}}{{this.path}}|{{/each}}';
    var server = null;
    var serverWithoutPost = null;

    var handler = function (request) {

        request.reply('ok');
    };

    function setupServer(done) {

        server = new Hapi.Server();
        server.route([
            { method: 'GET', path: '/test', config: { handler: handler, validate: { query: { param1: S().required() } } } },
            { method: 'POST', path: '/test', config: { handler: handler, validate: { query: { param2: S().valid('first', 'last') } } } },
            { method: 'GET', path: '/notincluded', config: { handler: handler, plugins: { lout: false } } }
        ]);

        server.plugin.require('../', { routeTemplate: routeTemplate, indexTemplate: indexTemplate }, function () {

            done();
        });
    }

    function setupServerWithoutPost(done) {

        serverWithoutPost = new Hapi.Server();
        serverWithoutPost.route({ method: 'GET', path: '/test', config: { handler: handler, validate: { query: { param1: S().required() } } } });

        serverWithoutPost.plugin.require('../', function () {

            done();
        });
    }

    function makeRequest(path, callback) {

        var next = function (res) {

            return callback(res.result);
        };

        server.inject({
            method: 'get',
            url: path
        }, next);
    }

    before(setupServer);

    it('shows template when correct path is provided', function (done) {

        makeRequest('/docs?path=/test', function (res) {

            expect(res).to.equal('GET|POST|');
            done();
        });
    });

    it('has a Not Found response when wrong path is provided', function (done) {

        makeRequest('/docs?path=blah', function (res) {

            expect(res.error).to.equal('Not Found');
            done();
        });
    });

    it('displays the index if no path is provided', function (done) {

        makeRequest('/docs', function (res) {

            expect(res).to.equal('/test|/test|');
            done();
        });
    });

    it('the index does\'t have the docs endpoint listed', function (done) {

        makeRequest('/docs', function (res) {

            expect(res).to.not.contain('/docs');
            done();
        });
    });

    it('the index does\'t include routes that are configured with docs disabled', function (done) {

        makeRequest('/docs', function (res) {

            expect(res).to.not.contain('/notincluded');
            done();
        });
    });

    describe('Index', function () {

        before(setupServerWithoutPost);

        it('doesn\'t throw an error when requesting the index when there are no POST routes', function (done) {

            serverWithoutPost.inject({
                method: 'get',
                url: '/docs'
            }, function (res) {

                expect(res).to.exist;
                expect(res.result).to.contain('/test');
                done();
            });
        });
    });
});