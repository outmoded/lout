// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
var cheerio = require('cheerio');
var Path = require('path');

// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;

describe('Registration', function() {

    it('should register', function(done) {

        var server = new Hapi.Server();

        server.pack.require('../', function () {

            var routes = server.table();
            expect(routes.length).to.equal(2);
            done();
        });
    });

    it('should register with options', function(done) {

        var server = new Hapi.Server();

        server.pack.require('../', { helpersPath: null, cssPath: null, endpoint: '/' }, function () {

            var routes = server.table();
            expect(routes.length).to.equal(1);
            done();
        });
    });
});

describe('Lout', function () {

    var server = null;
    before(function (done) {

        server = new Hapi.Server();

        server.route(require('./routes/default'));

        server.pack.require('../', function () {

            done();
        });
    });

    it('shows template when correct path is provided', function (done) {

        server.inject('/docs?path=/test', function (res) {

            var $ = cheerio.load(res.result);

            expect($('.anchor-link').length).to.equal(5);
            expect($('.anchor').length).to.equal(5);

            var matches = ['GET /test', 'HEAD /test', 'POST /test', 'PUT /test', 'DELETE /test'];
            var methodHeadings = $('.panel-heading .method-title');

            expect(methodHeadings.length).to.equal(5);

            methodHeadings.each(function() {

                expect(this.text()).to.contain(matches.shift());
            });

            expect($('.badge').length).to.equal(2);

            done();
        });
    });

    it('shows array objects', function (done) {

        server.inject('/docs?path=/rootarray', function (res) {

            var $ = cheerio.load(res.result);

            expect($('dt h6').length).to.equal(5);

            done();
        });
    });

    it('shows alternatives', function (done) {

        server.inject('/docs?path=/alternatives', function (res) {

            expect(res.result).to.contain('Alternatives');
            expect(res.result).to.contain('number');
            expect(res.result).to.contain('string');
            expect(res.result).to.contain('first');
            expect(res.result).to.contain('last');

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

            server.table().forEach(function (route) {
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

            expect(res.result).to.not.contain('?path=/docs');
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

    it('displays path parameters', function (done) {

        server.inject('/docs?path=/path/{pparam}/test', function (res) {

            expect(res.result).to.contain('Path Parameters');
            expect(res.result).to.contain('pparam');
            expect(res.result).to.contain('icon-star');
            done();
        });
    });

    it('should not show properties on empty objects', function (done) {

        server.inject('/docs?path=/emptyobject', function (res) {

            expect(res.result).to.contain('param1');
            expect(res.result.match(/Properties/g)).to.have.length(1);
            done();
        });
    });

    it('should display authentication information', function (done) {

        var server = new Hapi.Server();

        server.auth.scheme('testScheme', function() {

            return {
                authenticate: function() {},
                payload: function() {},
                response: function() {}
            };
        });
        server.auth.strategy('testStrategy', 'testScheme');

        server.route(require('./routes/withauth'));
        server.pack.require('../', function() {
            server.inject('/docs?path=/withauth', function (res) {

                expect(res).to.exist;
                expect(res.result).to.contain('Strategies');
                done();
            });
        });
    });

    it('should show routes without any validation', function (done) {

        server.inject('/docs?path=/novalidation', function (res) {

            expect(res.result).to.not.contain('Request Parameters');
            done();
        });
    });

    describe('Index', function () {

        it('doesn\'t throw an error when requesting the index when there are no POST routes', function (done) {

            var server = new Hapi.Server();

            server.route(require('./routes/withoutpost'));

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

describe('Customized Lout', function () {

    it('should fail with a basePath without helpers', function(done) {

        var server = new Hapi.Server();

        expect(function() {

            server.pack.require({
                '../': {
                    basePath: Path.join(__dirname, './custom-test-files')
                }
            }, function () {});
        }).to.throw(Error, 'ENOENT');
        done();
    });

    it('should succeed with a correct configuration', function(done) {

        var server = new Hapi.Server();

        server.pack.require({
            '../': {
                basePath: Path.join(__dirname, './custom-test-files'),
                helpersPath: null,
                cssPath: null
            }
        }, function () {

            done();
        });
    });

    it('should serve a custom css', function(done) {
        var server = new Hapi.Server();

        server.pack.require({
            '../': {
                cssPath: Path.join(__dirname, './custom-test-files/css')
            }
        }, function () {

            server.inject('/docs/css/style.css', function (res) {

                expect(res).to.exist;
                expect(res.result).to.contain('.cssTest');
                done();
            });
        });
    });
});
