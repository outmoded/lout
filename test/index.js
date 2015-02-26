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
var describe = lab.experiment;
var it = lab.test;
var expect = require('code').expect;

describe('Registration', function() {

    it('should register', function(done) {

        var server = new Hapi.Server().connection({ host: 'test' });

        server.register(require('../'), function() {

            var routes = server.table();
            expect(routes).to.have.length(1);
            expect(routes[0].table).to.have.length(2);
            done();
        });
    });

    it('should register with options', function(done) {

        var server = new Hapi.Server().connection({ host: 'test' });

        server.register({
            register: require('../'),
            options: {
                helpersPath: '.',
                cssPath: null,
                endpoint: '/'
            }
        }, function(err) {

            expect(err).to.not.exist();

            var routes = server.table();
            expect(routes[0].table).to.have.length(1);
            done();
        });
    });

    it('should fail to register with bad options', function (done) {

        var server = new Hapi.Server().connection({ host: 'test' });

        server.register({
            register: require('../'),
            options: {
                foo: 'bar'
            }
        }, function(err) {

            expect(err).to.exist();
            expect(err.message).to.equal('foo is not allowed');
            done();
        });
    });
});

describe('Lout', function() {

    var server = null;

    before(function(done) {

        server = new Hapi.Server().connection({ host: 'test' });

        server.route(require('./routes/default'));

        server.register(require('../'), function() {

            done();
        });
    });

    it('shows template when correct path is provided', function(done) {

        server.inject('/docs?server=http://test&path=/test', function(res) {

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
            expect($('h3.cors').length).to.equal(0);
            expect($('title').text()).to.include('/test');

            done();
        });
    });

    it('shows array objects', function(done) {

        server.inject('/docs?server=http://test&path=/rootarray', function(res) {

            var $ = cheerio.load(res.result);

            expect($('dt h6').length).to.equal(5);

            done();
        });
    });

    it('shows alternatives', function(done) {

        server.inject('/docs?server=http://test&path=/alternatives', function(res) {

            expect(res.result).to.contain('Alternatives');
            expect(res.result).to.contain('number');
            expect(res.result).to.contain('string');
            expect(res.result).to.contain('first');
            expect(res.result).to.contain('last');

            done();
        });
    });

    it('returns a Not Found response when wrong path is provided', function(done) {

        server.inject('/docs?server=http://test&path=blah', function(res) {

            expect(res.result.error).to.equal('Not Found');
            done();
        });
    });

    it('displays the index if no path is provided', function(done) {

        server.inject('/docs', function(res) {

            server.table()[0].table.forEach(function(route) {
                if ((route.settings.plugins && route.settings.plugins.lout === false) ||
                    route.path === '/docs' ||
                    route.method === 'options') {

                    expect(res.result).to.not.contain('?server=http://test&path=' + route.path);
                } else {
                    expect(res.result).to.contain('?server=http://test&path=' + route.path);
                }
            });
            done();
        });
    });

    it('index doesn\'t have the docs endpoint listed', function(done) {

        server.inject('/docs', function(res) {

            expect(res.result).to.not.contain('?server=http://test&path=/docs');
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

        server.inject('/docs?server=http://test&path=/nested', function(res) {

            expect(res.result).to.contain('param1');
            expect(res.result).to.contain('nestedparam1');
            expect(res.result).to.contain('icon-star');
            done();
        });
    });

    it('displays path parameters', function(done) {

        server.inject('/docs?server=http://test&path=/path/{pparam}/test', function(res) {

            expect(res.result).to.contain('Path Parameters');
            expect(res.result).to.contain('pparam');
            expect(res.result).to.contain('icon-star');
            done();
        });
    });

    it('should not show properties on empty objects', function(done) {

        server.inject('/docs?server=http://test&path=/emptyobject', function(res) {

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

        server.inject('/docs?server=http://test&path=/withnestedrulesarray', function(res) {

            expect(res.result).to.contain('Request Parameters');
            done();
        });
    });

    it('should show html notes', function(done) {

        server.inject('/docs?server=http://test&path=/withhtmlnote', function(res) {

            var $ = cheerio.load(res.result);
            expect($('.htmlroutenote').length).to.equal(1);
            expect($('.htmltypenote').length).to.equal(1);
            done();
        });
    });

    it('should show example', function(done) {

        server.inject('/docs?server=http://test&path=/withexample', function(res) {

            var $ = cheerio.load(res.result);
            expect($('.example').length).to.equal(1);
            done();
        });
    });

    it('should support multiple nested examples', function(done) {

        server.inject('/docs?server=http://test&path=/withnestedexamples', function(res) {

            var $ = cheerio.load(res.result);
            expect($('.example').length).to.equal(3);
            done();
        });
    });

    it('should support "false" as validation rule', function(done) {

        server.inject('/docs?server=http://test&path=/denybody', function(res) {

            expect(res.result).to.contain('Denied');
            done();
        });
    });

    it('should not detect "false" on an empty object', function(done) {

        server.inject('/docs?server=http://test&path=/rootemptyobject', function(res) {

            expect(res.result).to.not.contain('Denied');
            done();
        });
    });

    it('should show meta informations', function(done) {

        server.inject('/docs?server=http://test&path=/withmeta', function(res) {

            var $ = cheerio.load(res.result);
            expect($('.meta pre code').length).to.equal(1);
            done();
        });
    });

    it('should show units', function(done) {

        server.inject('/docs?server=http://test&path=/withunit', function(res) {

            expect(res.result).to.contain('Unit');
            expect(res.result).to.contain('ms');
            done();
        });
    });

    it('should show default values', function(done) {

        server.inject('/docs?server=http://test&path=/withdefaultvalue', function(res) {

            var $ = cheerio.load(res.result);
            expect($('dt.default-value').text()).to.equal('Default value');
            expect($('dd.default-value').text()).to.contain('42');
            done();
        });
    });

    it('should show binary types encoding', function(done) {

        server.inject('/docs?server=http://test&path=/withbinaryencoding', function(res) {

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

        server.inject('/docs?server=http://test&path=/withdate', function(res) {

            // The tests results will depend on the timezone it is executed on, so I'll only test for the presence
            // of something.
            var $ = cheerio.load(res.result);
            expect($('dt.rules-Min').text()).to.equal('Min');
            expect($('dd.rules-Min').text().replace(/\n|\s+/g, '')).to.not.be.empty();
            expect($('dt.rules-Max').text()).to.equal('Max');
            expect($('dd.rules-Max').text().replace(/\n|\s+/g, '')).to.not.be.empty();
            done();
        });
    });

    it('should show peer dependencies', function(done) {

        server.inject('/docs?server=http://test&path=/withpeersconditions', function(res) {

            expect(res.result).to.contain('Requires a and b and c.');
            expect(res.result).to.contain('Requires a or b or c.');
            expect(res.result).to.contain('Requires a xor b xor c.');
            expect(res.result).to.contain('Requires b, c to be present when a is.');
            expect(res.result).to.contain('Requires b, c to not be present when a is.');
            done();
        });
    });

    it('should show pattern on objects', function(done) {

        server.inject('/docs?server=http://test&path=/withpattern', function(res) {

            expect(res.result).to.contain('Patterns');
            expect(res.result).to.contain('/\\w\\d/');
            expect(res.result).to.contain('boolean');
            done();
        });
    });

    it('should show peer dependencies', function(done) {

        server.inject('/docs?server=http://test&path=/withallowunknown', function(res) {

            var $ = cheerio.load(res.result);
            expect($('dd.allow-unknown').text()).to.equal('truefalse');
            done();
        });
    });

    it('should show case insensitive string', function(done) {

        server.inject('/docs?server=http://test&path=/test', function(res) {

            var $ = cheerio.load(res.result);
            expect($('dd.case-insensitive').length).to.equal(1);
            done();
        });
    });

    it('should support string specifics', function(done) {

        server.inject('/docs?server=http://test&path=/withstringspecifics', function(res) {

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

        server.inject('/docs?server=http://test&path=/withconditionalalternatives', function(res) {

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

        server.inject('/docs?server=http://test&path=/withreferences', function(res) {

            var $ = cheerio.load(res.result);
            expect($('dd.ref-target').text())
                .to.contain('a.b')
                .to.contain('$x');
            done();
        });
    });

    it('should support assertions', function(done) {

        server.inject('/docs?server=http://test&path=/withassert', function(res) {

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

        server.inject('/docs?server=http://test&path=/withproperties', function(res) {

            var $ = cheerio.load(res.result);
            expect($('p.vhost').text()).to.equal('john.doe');
            expect($('dd.cors-maxAge').text()).to.equal('12345');
            expect($('p.jsonp').text()).to.equal('callback');
            done();
        });
    });

    it('should handle cors: true', function (done) {
        server.inject('/docs?server=http://test&path=/withcorstrue', function(res) {

            var $ = cheerio.load(res.result);
            expect($('h3.cors').text()).to.equal('CORS');
            expect($('dd.cors-isOriginExposed').text()).to.equal('true');
            done();
        });
    });

    it('should support references in rules', function(done) {

        server.inject('/docs?server=http://test&path=/withrulereference', function(res) {

            var $ = cheerio.load(res.result);
            expect($('.rules-Min .reference').text()).to.equal('param2');
            done();
        });
    });

    describe('Authentication', function() {

        var server;

        before(function(done) {

            server = new Hapi.Server().connection({ host: 'test' });

            server.auth.scheme('testScheme', function() {

                return {
                    authenticate: function() {},
                    payload: function() {},
                    response: function() {}
                };
            });
            server.auth.strategy('testStrategy', 'testScheme');

            server.route(require('./routes/withauth'));
            server.register(require('../'), function() {

                done();
            });
        });

        it('should display authentication information', function(done) {

            server.inject('/docs?server=http://test&path=/withauth', function(res) {

                expect(res).to.exist();
                expect(res.result).to.contain('Strategies');
                done();
            });
        });

        it('should display authentication information with an object', function(done) {

            server.inject('/docs?server=http://test&path=/withauthasobject', function(res) {

                var $ = cheerio.load(res.result);
                expect($('p.auth-strategies').text()).to.equal('testStrategy');
                expect($('p.auth-mode').text()).to.equal('try');
                expect($('p.auth-payload').text()).to.equal('optional');
                expect($('p.auth-scope').text()).to.equal('test');
                expect($('p.auth-entity').text()).to.equal('user');
                done();
            });
        });
    });

    describe('Index', function() {

        it('doesn\'t throw an error when requesting the index when there are no POST routes', function(done) {

            var server = new Hapi.Server().connection();

            server.route(require('./routes/withoutpost'));

            server.register(require('../'), function() {

                server.inject('/docs', function(res) {

                    expect(res).to.exist();
                    expect(res.result).to.contain('/test');
                    done();
                });
            });
        });
    });
});

describe('Customized Lout', function() {

    it('should succeed with a basePath without helpers', function(done) {

        var server = new Hapi.Server().connection();

        server.register({
            register: require('../'),
            options: {
                basePath: Path.join(__dirname, './custom-test-files')
            }
        }, function() {

            done();
        });
    });

    it('should succeed with a correct configuration', function(done) {

        var server = new Hapi.Server().connection();

        server.register({
            register: require('../'),
            options: {
                basePath: Path.join(__dirname, './custom-test-files'),
                helpersPath: '.',
                cssPath: null
            }
        }, function() {

            done();
        });
    });

    it('should succeed with a custom engine', function(done) {

        var server = new Hapi.Server().connection();

        var options = {
            engines: {
                custom: {
                    module: {
                        compile: function() {}
                    }
                }
            }
        };

        server.register({
            register: require('../'),
            options: options
        }, function(err) {

            expect(err).to.not.exist();
            done();
        });
    });

    it('should serve a custom css', function(done) {
        var server = new Hapi.Server().connection();

        server.register({
            register: require('../'),
            options: {
                cssPath: Path.join(__dirname, './custom-test-files/css')
            }
        }, function() {

            server.inject('/docs/css/style.css', function(res) {

                expect(res).to.exist();
                expect(res.result).to.contain('.cssTest');
                done();
            });
        });
    });

    it('ignores methods', function(done) {

        var server = new Hapi.Server().connection();

        server.route(require('./routes/default'));

        server.register({
            register: require('../'),
            options: {
                filterRoutes: function (route) {

                    return route.method !== 'delete' && route.path !== '/test';
                }
            }
        }, function() {
            server.inject('/docs', function(res) {

                expect(res.result).to.not.contain('?server=http://test&path=/test');
                expect(res.result).to.not.contain('#DELETE');
                done();
            });
        });
    });
});


describe('Multiple connections', function() {

    var server = null;

    before(function (done) {

        server = new Hapi.Server();
        server.connection({ host: 'test', port: 1, labels: 'c1' });
        server.connection({ host: 'test', port: 2, labels: 'c2' });

        server.route(require('./routes/default'));

        server.register(require('../'), function() {

            done();
        });
    });

    it('should load all the servers routes', function (done) {

        server.inject('/docs', function(res) {

            var tables = server.table();
            expect(tables).to.have.length(2);
            tables.forEach(function (connection) {

                expect(res.result).to.contain(connection.info.uri);

                connection.table.forEach(function(route) {

                    if ((route.settings.plugins && route.settings.plugins.lout === false) ||
                        route.path === '/docs' ||
                        route.method === 'options') {

                        expect(res.result).to.not.contain('?server=' + connection.info.uri + '&path=' + route.path);
                    } else {
                        expect(res.result).to.contain('?server=' + connection.info.uri + '&path=' + route.path);
                    }
                });
            });
            done();
        });
    });

    it('should only show one server if parameter is there', function (done) {

        server.inject('/docs?server=http://test:1', function(res) {

            var table = server.table();
            expect(table).to.have.length(2);

            var table1, table2;
            table.forEach(function (connection) {

                var uri = connection.info.uri;
                if (uri === 'http://test:1') {
                    table1 = connection.table;
                } else if (uri === 'http://test:2') {
                    table2 = connection.table;
                }
            });

            expect(res.result).to.contain('http://test:1');
            table1.forEach(function(route) {

                if ((route.settings.plugins && route.settings.plugins.lout === false) ||
                    route.path === '/docs' ||
                    route.method === 'options') {

                    expect(res.result).to.not.contain('?server=http://test:1&path=' + route.path);
                } else {
                    expect(res.result).to.contain('?server=http://test:1&path=' + route.path);
                }
            });

            expect(res.result).to.not.contain('http://test:2');
            table2.forEach(function(route) {

                expect(res.result).to.not.contain('?server=http://test:2&path=' + route.path);
            });

            done();
        });
    });
});

describe('Select connections', function() {

    var server = null;
    var selected = ['c2'];
    var unselected = ['c1'];

    before(function (done) {

        server = new Hapi.Server();
        server.connection({ host: 'test', port: 1, labels: 'c1' });
        server.connection({ host: 'test', port: 2, labels: 'c2' });

        server.route(require('./routes/default'));

        server.register(require('../'), { select: 'c2' }, function() {

            done();
        });
    });

    it('should load all the selected servers routes', function (done) {

        server.select(selected).inject('/docs', function(res) {

            var selectedTables = server.select(selected).table();
            var unselectedTables = server.select(unselected).table();
            expect(selectedTables).to.have.length(1);
            expect(unselectedTables).to.have.length(1);
            selectedTables.forEach(function (connection) {

                expect(res.result).to.contain(connection.info.uri);

                connection.table.forEach(function(route) {

                    if ((route.settings.plugins && route.settings.plugins.lout === false) ||
                        route.path === '/docs' ||
                        route.method === 'options') {

                        expect(res.result).to.not.contain('?server=' + connection.info.uri + '&path=' + route.path);
                    } else {
                        expect(res.result).to.contain('?server=' + connection.info.uri + '&path=' + route.path);
                    }
                });
            });
            unselectedTables.forEach(function (connection) {

                expect(res.result).to.not.contain(connection.info.uri);
            });
            done();
        });
    });
});

describe('Multiple paths', function () {

    it('should show separate paths', function (done) {

        var server = new Hapi.Server().connection({ host: 'test' });
        server.route({
            method: 'GET',
            path: '/v1/test',
            handler: function() {}
        });
        server.route({
            method: 'GET',
            path: '/v2/test',
            handler: function() {}
        });
        server.route({
            method: 'GET',
            path: '/another',
            handler: function() {}
        });

        server.register([{
            register: require('../'),
            options: {
                endpoint: '/docs/v1',
                filterRoutes: function (route) {
                    return /^\/v1/.test(route.path);
                }
            }
        }, {
            register: require('../'),
            options: {
                endpoint: '/docs/v2',
                filterRoutes: function (route) {
                    return /^\/v2/.test(route.path);
                }
            }
        }], function(err) {

            expect(err).to.not.exist();

            var routes = server.table();
            expect(routes[0].table).to.have.length(7); // 3 routes, 2 docs routes, 2 css routes

            server.inject('/docs/v1', function (res) {

                var $ = cheerio.load(res.result);
                expect($('.route-index > a').length).to.equal(1);
                expect($('.route-index > a').attr('href')).to.equal('?server=http://test&path=/v1/test#GET');

                server.inject('/docs/v2', function (res) {

                    var $ = cheerio.load(res.result);
                    expect($('.route-index > a').length).to.equal(1);
                    expect($('.route-index > a').attr('href')).to.equal('?server=http://test&path=/v2/test#GET');

                    server.inject('/docs', function (res) {

                        expect(res.statusCode).to.equal(404);
                        done();
                    });
                });
            });
        });
    });
});
