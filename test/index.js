// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
var cheerio = require('cheerio');

// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;

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

            var matches = ['GET /test', 'POST /test'];
            $('.panel-heading h2').each(function() {

                expect(matches.shift()).to.equal(this.text());
            });

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
