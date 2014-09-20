// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
var cheerio = require('cheerio');
var Path = require('path');

// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var before = lab.before;
var after = lab.after;
var describe = lab.experiment;
var it = lab.test;
var expect = Lab.expect;

describe('Registration', function() {

    it('should register', function(done) {

        var server = new Hapi.Server();

        server.pack.register(require('../'), function() {

            var routes = server.table();
            expect(routes.length).to.equal(2);
            done();
        });
    });

    it('should register with options', function(done) {

        var server = new Hapi.Server();

        server.pack.register({
            plugin: require('../'),
            options: {
                helpersPath: null,
                cssPath: null,
                endpoint: '/'
            }
        }, function() {

            var routes = server.table();
            expect(routes.length).to.equal(1);
            done();
        });
    });
});

describe('Lout', function() {

    var server = null;
    before(function(done) {

        server = new Hapi.Server();

        server.route(require('./routes/default'));

        server.pack.register(require('../'), function() {

            done();
        });
    });

    it('shows template when correct path is provided', function(done) {

        server.inject('/docs?path=/test', function(res) {

            var $ = cheerio.load(res.result);

            expect($('.anchor-link').length).to.equal(5);
            expect($('.anchor').length).to.equal(5);

            var matches = ['GET/test', 'HEAD/test', 'POST/test', 'PUT/test', 'DELETE/test'];
            var methodHeadings = $('.panel-heading .method-title');

            expect(methodHeadings.length).to.equal(5);

            methodHeadings.each(function() {

                expect($(this).text().replace(/\n|\s+/g, '')).to.contain(matches.shift());
            });

            expect($('.badge').length).to.equal(2);

            done();
        });
    });

    it('shows array objects', function(done) {

        server.inject('/docs?path=/rootarray', function(res) {

            var $ = cheerio.load(res.result);

            expect($('dt h6').length).to.equal(5);

            done();
        });
    });

    it('shows alternatives', function(done) {

        server.inject('/docs?path=/alternatives', function(res) {

            expect(res.result).to.contain('Alternatives');
            expect(res.result).to.contain('number');
            expect(res.result).to.contain('string');
            expect(res.result).to.contain('first');
            expect(res.result).to.contain('last');

            done();
        });
    });

    it('returns a Not Found response when wrong path is provided', function(done) {

        server.inject('/docs?path=blah', function(res) {

            expect(res.result.error).to.equal('Not Found');
            done();
        });
    });

    it('displays the index if no path is provided', function(done) {

        server.inject('/docs', function(res) {

            server.table().forEach(function(route) {
                if ((route.settings.plugins && route.settings.plugins.lout === false) || route.path === '/docs') {
                    expect(res.result).to.not.contain('?path=' + route.path);
                } else {
                    expect(res.result).to.contain('?path=' + route.path);
                }
            });
            done();
        });
    });

    it('index doesn\'t have the docs endpoint listed', function(done) {

        server.inject('/docs', function(res) {

            expect(res.result).to.not.contain('?path=/docs');
            done();
        });
    });

    it('index doesn\'t include routes that are configured with docs disabled', function(done) {

        server.inject('/docs', function(res) {

            expect(res.result).to.not.contain('/notincluded');
            done();
        });
    });

    it('displays nested rules', function(done) {

        server.inject('/docs?path=/nested', function(res) {

            expect(res.result).to.contain('param1');
            expect(res.result).to.contain('nestedparam1');
            expect(res.result).to.contain('icon-star');
            done();
        });
    });

    it('displays path parameters', function(done) {

        server.inject('/docs?path=/path/{pparam}/test', function(res) {

            expect(res.result).to.contain('Path Parameters');
            expect(res.result).to.contain('pparam');
            expect(res.result).to.contain('icon-star');
            done();
        });
    });

    it('should not show properties on empty objects', function(done) {

        server.inject('/docs?path=/emptyobject', function(res) {

            expect(res.result).to.contain('param1');
            expect(res.result.match(/Properties/g)).to.have.length(1);
            done();
        });
    });

    it('should show routes without any validation', function(done) {

        server.inject('/docs?path=/novalidation', function(res) {

            expect(res.result).to.not.contain('Parameters');
            done();
        });
    });

    it('should handle invalid array of rules', function(done) {

        server.inject('/docs?path=/withnestedrulesarray', function(res) {

            expect(res.result).to.contain('Request Parameters');
            done();
        });
    });

    it('should show html notes', function(done) {

        server.inject('/docs?path=/withhtmlnote', function(res) {

            var $ = cheerio.load(res.result);
            expect($('.htmlroutenote').length).to.equal(1);
            expect($('.htmltypenote').length).to.equal(1);
            done();
        });
    });

    it('should show example', function(done) {

        server.inject('/docs?path=/withexample', function(res) {

            var $ = cheerio.load(res.result);
            expect($('.example').length).to.equal(1);
            done();
        });
    });

    it('should support multiple nested examples', function(done) {

        server.inject('/docs?path=/withnestedexamples', function(res) {

            var $ = cheerio.load(res.result);
            expect($('.example').length).to.equal(3);
            done();
        });
    });

    it('should support "false" as validation rule', function(done) {

        server.inject('/docs?path=/denybody', function(res) {

            expect(res.result).to.contain('Denied');
            done();
        });
    });

    it('should not detect "false" on an empty object', function(done) {

        server.inject('/docs?path=/rootemptyobject', function(res) {

            expect(res.result).to.not.contain('Denied');
            done();
        });
    });

    it('should show meta informations', function(done) {

        server.inject('/docs?path=/withmeta', function(res) {

            var $ = cheerio.load(res.result);
            expect($('.meta pre code').length).to.equal(1);
            done();
        });
    });

    it('should show units', function(done) {

        server.inject('/docs?path=/withunit', function(res) {

            expect(res.result).to.contain('Unit');
            expect(res.result).to.contain('ms');
            done();
        });
    });

    it('should show default values', function(done) {

        server.inject('/docs?path=/withdefaultvalue', function(res) {

            var $ = cheerio.load(res.result);
            expect($('dt.default-value').text()).to.equal('Default value');
            expect($('dd.default-value').text()).to.contain('42');
            done();
        });
    });

    it('should show binary types encoding', function(done) {

        server.inject('/docs?path=/withbinaryencoding', function(res) {

            var $ = cheerio.load(res.result);
            expect($('dt.encoding').text()).to.equal('Encoding');
            expect($('dd.encoding').text()).to.equal('base64');
            expect($('dt.rules-Min').text()).to.equal('Min');
            expect($('dd.rules-Min').text()).to.contain('42');
            expect($('dt.rules-Max').text()).to.equal('Max');
            expect($('dd.rules-Max').text()).to.contain('128');
            expect($('dt.rules-Length').text()).to.equal('Length');
            expect($('dd.rules-Length').text()).to.contain('64');
            done();
        });
    });

    it('should show dates with min and max', function(done) {

        server.inject('/docs?path=/withdate', function(res) {

            // The tests results will depend on the timezone it is executed on, so I'll only test for the presence
            // of something.
            var $ = cheerio.load(res.result);
            expect($('dt.rules-Min').text()).to.equal('Min');
            expect($('dd.rules-Min').text().replace(/\n|\s+/g, '')).to.have.length.above(0);
            expect($('dt.rules-Max').text()).to.equal('Max');
            expect($('dd.rules-Max').text().replace(/\n|\s+/g, '')).to.have.length.above(0);
            done();
        });
    });

    it('should show peer dependencies', function(done) {

        server.inject('/docs?path=/withpeersconditions', function(res) {

            expect(res.result).to.contain('Requires a and b and c.');
            expect(res.result).to.contain('Requires a or b or c.');
            expect(res.result).to.contain('Requires a xor b xor c.');
            expect(res.result).to.contain('Requires b, c to be present when a is.');
            expect(res.result).to.contain('Requires b, c to not be present when a is.');
            done();
        });
    });

    it('should show pattern on objects', function(done) {

        server.inject('/docs?path=/withpattern', function(res) {

            expect(res.result).to.contain('Patterns');
            expect(res.result).to.contain('/\\w\\d/');
            expect(res.result).to.contain('boolean');
            done();
        });
    });

    it('should show peer dependencies', function(done) {

        server.inject('/docs?path=/withallowunknown', function(res) {

            var $ = cheerio.load(res.result);
            expect($('dd.allow-unknown').text()).to.equal('truefalse');
            done();
        });
    });

    it('should show case insensitive string', function(done) {

        server.inject('/docs?path=/test', function(res) {

            var $ = cheerio.load(res.result);
            expect($('dd.case-insensitive').length).to.equal(1);
            done();
        });
    });

    it('should support string specifics', function(done) {

        server.inject('/docs?path=/withstringspecifics', function(res) {

            var $ = cheerio.load(res.result);
            var ddRules = 'dd.rules-';
            var rulesSelector = ddRules + ['Alphanum', 'Regex', 'Token', 'Email', 'Guid', 'IsoDate', 'Hostname',
                'Lowercase', 'Uppercase', 'Trim'
            ].join(',' + ddRules);

            expect($('dd.rules-Regex').text()).to.contain('/\\d{3}.*/');
            expect($(rulesSelector).length).to.equal(10);
            done();
        });
    });

    it('should support conditional alternatives', function(done) {

        server.inject('/docs?path=/withconditionalalternatives', function(res) {

            var $ = cheerio.load(res.result);
            expect($('.condition-text').text().replace(/\n|\s+/g, ''))
                .to.contain('Ifbmatchesthefollowingmodel')
                .to.contain('Ifamatchesthefollowingmodel');
            expect($('.condition-model').length).to.equal(2);
            expect($('.consequence-model').length).to.equal(4);
            expect($('.type > dd').text())
                .to.contain('string')
                .to.contain('number')
                .to.contain('boolean')
                .to.contain('date');
            done();
        });
    });

    it('should support references', function(done) {

        server.inject('/docs?path=/withreferences', function(res) {

            var $ = cheerio.load(res.result);
            expect($('dd.ref-target').text())
                .to.contain('a.b')
                .to.contain('$x');
            done();
        });
    });

    it('should support assertions', function(done) {

        server.inject('/docs?path=/withassert', function(res) {

            var $ = cheerio.load(res.result);
            expect($('.assertion-text').text().replace(/\n|\s+/g, ''))
                .to.contain('Assertsthatd.ematchesthefollowingmodel')
                .to.contain('Assertsthat$xmatchesthefollowingmodel');
            expect($('dd.ref-target').text())
                .to.contain('a.c')
                .to.contain('b.e');
            done();
        });
    });

    it('should show properties of the route', function(done) {

        server.inject('/docs?path=/withproperties', function(res) {

            var $ = cheerio.load(res.result);
            expect($('p.vhost').text()).to.equal('john.doe');
            expect($('p.cors').text()).to.equal('false');
            expect($('p.jsonp').text()).to.equal('callback');
            done();
        });
    });

    describe('Authentication', function() {

        var server;

        before(function(done) {

            server = new Hapi.Server();

            server.auth.scheme('testScheme', function() {

                return {
                    authenticate: function() {},
                    payload: function() {},
                    response: function() {}
                };
            });
            server.auth.strategy('testStrategy', 'testScheme');

            server.route(require('./routes/withauth'));
            server.pack.register(require('../'), function() {

                done();
            });
        });

        it('should display authentication information', function(done) {

            server.inject('/docs?path=/withauth', function(res) {

                expect(res).to.exist;
                expect(res.result).to.contain('Strategies');
                done();
            });
        });

        it('should display authentication information with an object', function(done) {

            server.inject('/docs?path=/withauthasobject', function(res) {

                var $ = cheerio.load(res.result);
                expect($('p.auth-strategies').text()).to.equal('testStrategy');
                expect($('p.auth-mode').text()).to.equal('try');
                expect($('p.auth-payload').text()).to.equal('optional');
                expect($('p.auth-scope').text()).to.equal('test');
                expect($('p.auth-entity').text()).to.equal('user');
                expect($('p.auth-tos').text()).to.equal('1.0.0');
                done();
            });
        });
    });

    describe('Index', function() {

        it('doesn\'t throw an error when requesting the index when there are no POST routes', function(done) {

            var server = new Hapi.Server();

            server.route(require('./routes/withoutpost'));

            server.pack.register(require('../'), function() {

                server.inject('/docs', function(res) {

                    expect(res).to.exist;
                    expect(res.result).to.contain('/test');
                    done();
                });
            });
        });
    });
});

describe('Customized Lout', function() {

    it('should succeed with a basePath without helpers', function(done) {

        var server = new Hapi.Server();

        server.pack.register({
            plugin: require('../'),
            options: {
                basePath: Path.join(__dirname, './custom-test-files')
            }
        }, function() {

            done();
        });
    });

    it('should succeed with a correct configuration', function(done) {

        var server = new Hapi.Server();

        server.pack.register({
            plugin: require('../'),
            options: {
                basePath: Path.join(__dirname, './custom-test-files'),
                helpersPath: null,
                cssPath: null
            }
        }, function() {

            done();
        });
    });

    it('should succeed with a custom engine', function(done) {

        var server = new Hapi.Server();

        var options = {
            engines: {
                custom: {
                    module: {
                        compile: function() {}
                    }
                }
            }
        };

        server.pack.register({
            plugin: require('../'),
            options: options
        }, function() {

            done();
        });
    });

    it('should serve a custom css', function(done) {
        var server = new Hapi.Server();

        server.pack.register({
            plugin: require('../'),
            options: {
                cssPath: Path.join(__dirname, './custom-test-files/css')
            }
        }, function() {

            server.inject('/docs/css/style.css', function(res) {

                expect(res).to.exist;
                expect(res.result).to.contain('.cssTest');
                done();
            });
        });
    });
});
