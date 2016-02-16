'use strict';

// Load modules

const Lab = require('lab');
const Hapi = require('hapi');
const Cheerio = require('cheerio');
const Path = require('path');
const Inert = require('inert');
const Vision = require('vision');

// Declare internals

const internals = {
    bootstrapServer(server, plugins, options, callback) {

        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        server.register([Inert, Vision].concat(plugins), options, (err) => {

            if (err) {
                return callback(err);
            }

            server.initialize(callback);
        });
    }
};


// Test shortcuts

const lab = exports.lab = Lab.script();
const before = lab.before;
const describe = lab.experiment;
const it = lab.test;
const expect = require('code').expect;

describe('Registration', () => {

    it('should register', (done) => {

        const server = new Hapi.Server();
        server.connection({ host: 'test' });

        internals.bootstrapServer(server, require('../'), () => {

            const routes = server.table();
            expect(routes).to.have.length(1);
            expect(routes[0].table).to.have.length(2);
            done();
        });
    });

    it('should register with options', (done) => {

        const server = new Hapi.Server();
        server.connection({ host: 'test' });

        internals.bootstrapServer(server, {
            register: require('../'),
            options: {
                helpersPath: '.',
                cssPath: null,
                endpoint: '/'
            }
        }, (err) => {

            expect(err).to.not.exist();

            const routes = server.table();
            expect(routes[0].table).to.have.length(1);
            done();
        });
    });

    it('should fail to register with bad options', (done) => {

        const server = new Hapi.Server();
        server.connection({ host: 'test' });

        internals.bootstrapServer(server, {
            register: require('../'),
            options: {
                foo: 'bar'
            }
        }, (err) => {

            expect(err).to.exist();
            expect(err.message).to.equal('"foo" is not allowed');
            done();
        });
    });


    it('should register with malformed endpoint', (done) => {

        const server = new Hapi.Server();
        server.connection({ host: 'test' });

        internals.bootstrapServer(server, {
            register: require('../'),
            options: {
                endpoint: 'api/'
            }
        }, (err) => {

            expect(err).to.not.exist();

            const routes = server.table();
            const endpoints = routes[0].table;
            expect(endpoints).to.have.length(2);
            expect(endpoints).to.part.deep.include([{ path: '/api' }, { path: '/api/css/{path*}' }]);
            done();
        });
    });
});

describe('Lout', () => {

    let server;

    before((done) => {

        server = new Hapi.Server();
        server.connection({ host: 'test' });

        server.route(require('./routes/default'));

        internals.bootstrapServer(server, require('../'), done);
    });

    it('shows template when correct path is provided', (done) => {

        server.inject('/docs?server=http://test&path=/test', (res) => {

            const $ = Cheerio.load(res.result);

            expect($('.anchor-link').length).to.equal(5);
            expect($('.anchor').length).to.equal(5);

            const matches = ['GET/test', 'POST/test', 'PUT/test', 'PATCH/test', 'DELETE/test'];
            const methodHeadings = $('.panel-heading .method-title');

            expect(methodHeadings.length).to.equal(5);

            methodHeadings.each(function () {

                expect($(this).text().replace(/\n|\s+/g, '')).to.contain(matches.shift());
            });

            expect($('.badge').length).to.equal(3);
            expect($('h3.cors').length).to.equal(0);
            expect($('title').text()).to.include('/test');

            done();
        });
    });

    it('shows array objects', (done) => {

        server.inject('/docs?server=http://test&path=/rootarray', (res) => {

            const $ = Cheerio.load(res.result);

            expect($('.type-header').length).to.equal(5);

            done();
        });
    });

    it('shows alternatives', (done) => {

        server.inject('/docs?server=http://test&path=/alternatives', (res) => {

            expect(res.result).to.contain('field-alternatives');
            expect(res.result).to.contain('number');
            expect(res.result).to.contain('one of');
            expect(res.result).to.contain('first');
            expect(res.result).to.contain('last');

            done();
        });
    });

    it('returns a Not Found response when wrong path is provided', (done) => {

        server.inject('/docs?server=http://test&path=blah', (res) => {

            expect(res.result.error).to.equal('Not Found');
            done();
        });
    });

    it('displays the index if no path is provided', (done) => {

        server.inject('/docs', (res) => {

            server.table()[0].table.forEach((route) => {

                if ((route.settings.plugins && (route.settings.plugins.lout === false || route.settings.isInternal)) ||
                    route.path === '/docs' ||
                    route.method === 'options') {

                    expect(res.result).to.not.contain(`?server=http://test&path=${route.path}`);
                }
                else {
                    expect(res.result).to.contain(`?server=http://test&path=${route.path}`);
                }
            });
            done();
        });
    });

    it('index doesn\'t have the docs endpoint listed', (done) => {

        server.inject('/docs', (res) => {

            expect(res.result).to.not.contain('?server=http://test&path=/docs');
            done();
        });
    });

    it('index doesn\'t include routes that are configured with docs disabled', (done) => {

        server.inject('/docs', (res) => {

            expect(res.result).to.not.contain('/notincluded');
            done();
        });
    });

    it('displays nested rules', (done) => {

        server.inject('/docs?server=http://test&path=/nested', (res) => {

            expect(res.result).to.contain('param1');
            expect(res.result).to.contain('nestedparam1');
            expect(res.result).to.contain('icon-star');
            done();
        });
    });

    it('displays path parameters', (done) => {

        server.inject('/docs?server=http://test&path=/path/{pparam}/test', (res) => {

            expect(res.result).to.contain('Path Parameters');
            expect(res.result).to.contain('pparam');
            expect(res.result).to.contain('icon-star');
            done();
        });
    });

    it('should not show properties on empty objects', (done) => {

        server.inject('/docs?server=http://test&path=/emptyobject', (res) => {

            expect(res.result).to.contain('param1');
            expect(res.result.match(/list-children/g)).to.have.length(2);
            done();
        });
    });

    it('should show routes without any validation', (done) => {

        server.inject('/docs?path=/novalidation', (res) => {

            expect(res.result).to.not.contain('Parameters');
            done();
        });
    });

    it('should handle invalid array of rules', (done) => {

        server.inject('/docs?server=http://test&path=/withnestedrulesarray', (res) => {

            expect(res.result).to.contain('Request Parameters');
            done();
        });
    });

    it('should show html notes', (done) => {

        server.inject('/docs?server=http://test&path=/withhtmlnote', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('.htmlroutenote').length).to.equal(1);
            expect($('.htmltypenote').length).to.equal(1);
            done();
        });
    });

    it('should show note arrays', (done) => {

        server.inject('/docs?server=http://test&path=/withnotesarray', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('.htmltypenote').length).to.equal(2);
            done();
        });
    });

    it('should show example', (done) => {

        server.inject('/docs?server=http://test&path=/withexample', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('.example').length).to.equal(1);
            done();
        });
    });

    it('should support multiple nested examples', (done) => {

        server.inject('/docs?server=http://test&path=/withnestedexamples', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('.example').length).to.equal(3);
            done();
        });
    });

    it('should support "false" as validation rule', (done) => {

        server.inject('/docs?server=http://test&path=/denybody', (res) => {

            expect(res.result).to.contain('Denied');
            done();
        });
    });

    it('should not detect "false" on an empty object', (done) => {

        server.inject('/docs?server=http://test&path=/rootemptyobject', (res) => {

            expect(res.result).to.not.contain('Denied');
            done();
        });
    });

    it('should show meta informations', (done) => {

        server.inject('/docs?server=http://test&path=/withmeta', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('.field-meta pre code').length).to.equal(1);
            done();
        });
    });

    it('should show units', (done) => {

        server.inject('/docs?server=http://test&path=/withunit', (res) => {

            expect(res.result).to.contain('Unit');
            expect(res.result).to.contain('ms');
            done();
        });
    });

    it('should show default values', (done) => {

        server.inject('/docs?server=http://test&path=/withdefaultvalue', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('dt.default-value').text()).to.equal('Default value');
            expect($('dd.default-value').text()).to.contain('42');
            done();
        });
    });

    it('should show default values as function', (done) => {

        server.inject('/docs?server=http://test&path=/withdefaultvaluefn', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('dt.default-value').text()).to.equal('Default value');
            expect($('dd.default-value').text()).to.equal('"default test"');
            done();
        });
    });

    it('should show binary types encoding', (done) => {

        server.inject('/docs?server=http://test&path=/withbinaryencoding', (res) => {

            const $ = Cheerio.load(res.result);
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

    it('should show dates with min and max', (done) => {

        server.inject('/docs?server=http://test&path=/withdate', (res) => {

            // The tests results will depend on the timezone it is executed on, so I'll only test for the presence
            // of something.
            const $ = Cheerio.load(res.result);
            expect($('dt.rules-Min').text()).to.equal('Min');
            expect($('dd.rules-Min').text().replace(/\n|\s+/g, '')).to.not.be.empty();
            expect($('dt.rules-Max').text()).to.equal('Max');
            expect($('dd.rules-Max').text().replace(/\n|\s+/g, '')).to.not.be.empty();
            done();
        });
    });

    it('should show peer dependencies', (done) => {

        server.inject('/docs?server=http://test&path=/withpeersconditions', (res) => {

            expect(res.result).to.contain('Requires a and b and c.');
            expect(res.result).to.contain('Requires a or b or c.');
            expect(res.result).to.contain('Requires a xor b xor c.');
            expect(res.result).to.contain('Requires b, c to be present when a is.');
            expect(res.result).to.contain('Requires b, c to not be present when a is.');
            done();
        });
    });

    it('should show pattern on objects', (done) => {

        server.inject('/docs?server=http://test&path=/withpattern', (res) => {

            expect(res.result).to.contain('/\\w\\d/');
            expect(res.result).to.contain('boolean');
            done();
        });
    });

    it('should show peer dependencies', (done) => {

        server.inject('/docs?server=http://test&path=/withallowunknown', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('.allow-unknown').length).to.equal(1);
            done();
        });
    });

    it('should show case insensitive string', (done) => {

        server.inject('/docs?server=http://test&path=/test', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('.case-insensitive').length).to.equal(1);
            done();
        });
    });

    it('should not show forbidden values for simple numbers', (done) => {

        server.inject('/docs?server=http://test&path=/test', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('.field-forbidden-values').text()).to.equal('none of"second"');
            done();
        });
    });

    it('should support string specifics', (done) => {

        server.inject('/docs?server=http://test&path=/withstringspecifics', (res) => {

            const $ = Cheerio.load(res.result);
            const ddRules = 'dt.rules-';
            const rulesSelector = ddRules + ['Alphanum', 'Regex', 'Token', 'Email', 'Guid', 'IsoDate', 'Hostname',
                'Lowercase', 'Uppercase', 'Trim'
            ].join(`,${ddRules}`);

            expect($('dd.rules-Regex').text()).to.contain('/\\d{3}.*/');
            expect($(rulesSelector).length).to.equal(10);
            done();
        });
    });

    it('should support conditional alternatives', (done) => {

        server.inject('/docs?server=http://test&path=/withconditionalalternatives', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('.condition-text').text().replace(/\n|\s+/g, ''))
                .to.contain('Ifbmatchesthefollowingmodel')
                .to.contain('Ifamatchesthefollowingmodel');
            expect($('.condition-model').length).to.equal(4);
            expect($('.consequence-model').length).to.equal(8);
            expect($('.field-alternatives .type-header').text())
                .to.contain('string')
                .to.contain('number')
                .to.contain('boolean')
                .to.contain('date');
            done();
        });
    });

    it('should support references', (done) => {

        server.inject('/docs?server=http://test&path=/withreferences', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('dd.ref-target').text())
                .to.contain('a.b')
                .to.contain('$x');
            done();
        });
    });

    it('should support assertions', (done) => {

        server.inject('/docs?server=http://test&path=/withassert', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('.assertion-text').text().replace(/\n|\s+/g, ''))
                .to.contain('Assertsthatd.ematchesthefollowingmodel')
                .to.contain('Assertsthat$xmatchesthefollowingmodel');
            expect($('dd.ref-target').text())
                .to.contain('a.c')
                .to.contain('b.e');
            done();
        });
    });

    it('should show properties of the route', (done) => {

        server.inject('/docs?server=http://test&path=/withproperties', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('p.vhost').text()).to.equal('john.doe');
            expect($('dd.cors-maxAge').text()).to.equal('12345');
            expect($('p.jsonp').text()).to.equal('callback');
            done();
        });
    });

    it('should handle cors: true', (done) => {

        server.inject('/docs?server=http://test&path=/withcorstrue', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('h3.cors').text()).to.equal('CORS');
            expect($('dd.cors-maxAge').text()).to.equal('86400');
            done();
        });
    });

    it('should support references in rules', (done) => {

        server.inject('/docs?server=http://test&path=/withrulereference', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('.rules-Min .reference').text()).to.equal('param2');
            done();
        });
    });

    it('should remove stripped fields', (done) => {

        server.inject('/docs?server=http://test&path=/withstrip', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('.glyphicon-trash')).to.have.length(1);
            done();
        });
    });

    it('should not show internal routes', (done) => {

        server.inject('/docs', (resRoot) => {

            expect(resRoot.result).to.not.contain('/result');

            server.inject('/docs?server=http://test&path=/internal', (resPath) => {

                expect(resPath.statusCode).to.equal(404);
                done();
            });
        });
    });


    it('should support status schema', (done) => {

        server.inject('/docs?server=http://test&path=/withstatus', (res) => {

            const $ = Cheerio.load(res.result);
            expect($('.collapse').text())
                .to.contain('204')
                .to.contain('param2')
                .to.contain('404')
                .to.contain('Failure');
            done();
        });
    });


    describe('Authentication', () => {

        before((done) => {

            server = new Hapi.Server();
            server.connection({ host: 'test' });

            server.auth.scheme('testScheme', () => ({
                authenticate() {},
                payload() {},
                response() {}
            }));
            server.auth.strategy('testStrategy', 'testScheme', true);

            server.route(require('./routes/withauth'));
            internals.bootstrapServer(server, require('../'), done);
        });

        it('should display authentication information', (done) => {

            server.inject('/docs?server=http://test&path=/withauth', (res) => {

                expect(res).to.exist();
                expect(res.result).to.contain('Strategies');
                done();
            });
        });

        it('should display authentication information with an object', (done) => {

            server.inject('/docs?server=http://test&path=/withauthasobject', (res) => {

                const $ = Cheerio.load(res.result);
                expect($('p.auth-strategies').text()).to.equal('testStrategy');
                expect($('p.auth-mode').text()).to.equal('try');
                expect($('p.auth-payload').text()).to.equal('optional');
                expect($('p.auth-scope').text()).to.equal('test');
                expect($('p.auth-entity').text()).to.equal('user');
                done();
            });
        });

        it('should display authentication information with multiple access', (done) => {

            server.inject('/docs?server=http://test&path=/withmultipleaccess', (res) => {

                const $ = Cheerio.load(res.result);
                expect($('p.auth-strategies').text()).to.equal('testStrategy');
                expect($('p.auth-mode').text()).to.equal('try');
                expect($('p.auth-payload').text()).to.equal('optional');
                expect($('p.auth-scope').text()).to.equal('bc,daabcd');
                expect($('p.auth-entity').text()).to.equal('userany');
                done();
            });
        });

        it('should display authentication information with a default auth', (done) => {

            server.inject('/docs?server=http://test&path=/withimplicitauth', (res) => {

                const $ = Cheerio.load(res.result);
                expect($('p.auth-strategies').text()).to.equal('testStrategy');
                expect($('p.auth-mode').text()).to.equal('required');
                expect($('p.auth-payload').length).to.equal(0);
                expect($('p.auth-scope').length).to.equal(0);
                expect($('p.auth-entity').length).to.equal(0);
                done();
            });
        });
    });

    describe('Index', () => {

        it('doesn\'t throw an error when requesting the index when there are no POST routes', (done) => {

            server = new Hapi.Server();
            server.connection();

            server.route(require('./routes/withoutpost'));

            internals.bootstrapServer(server, require('../'), (err) => {

                expect(err).to.not.exist();

                server.inject('/docs', (res) => {

                    expect(res).to.exist();
                    expect(res.result).to.contain('/test');
                    done();
                });
            });
        });
    });
});

describe('Customized Lout', () => {

    it('should succeed with a basePath without helpers', (done) => {

        const server = new Hapi.Server();
        server.connection();

        internals.bootstrapServer(server, {
            register: require('../'),
            options: {
                basePath: Path.join(__dirname, './custom-test-files')
            }
        }, done);
    });

    it('should succeed with an apiVersion', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(require('./routes/default'));

        internals.bootstrapServer(server, {
            register: require('../'),
            options: {
                apiVersion: '3.3.3'
            }
        }, (err) => {

            expect(err).to.not.exist();

            server.inject('/docs', (res) => {

                expect(res).to.exist();
                const $ = Cheerio.load(res.result);
                expect($('a.navbar-brand').text()).to.match(/v3\.3\.3$/);
                done();
            });
        });
    });

    it('should succeed with a correct configuration', (done) => {

        const server = new Hapi.Server();
        server.connection();

        internals.bootstrapServer(server, {
            register: require('../'),
            options: {
                basePath: Path.join(__dirname, './custom-test-files'),
                helpersPath: '.',
                cssPath: null
            }
        }, done);
    });

    it('should succeed with a custom engine', (done) => {

        const server = new Hapi.Server();
        server.connection();

        const options = {
            engines: {
                custom: {
                    module: {
                        compile() {}
                    }
                }
            }
        };

        internals.bootstrapServer(server, {
            register: require('../'),
            options: options
        }, done);
    });

    it('should serve a custom css', (done) => {

        const server = new Hapi.Server();
        server.connection();

        internals.bootstrapServer(server, {
            register: require('../'),
            options: {
                cssPath: Path.join(__dirname, './custom-test-files/css')
            }
        }, (err) => {

            expect(err).not.to.exist();

            server.inject('/docs/css/style.css', (res) => {

                expect(res).to.exist();
                expect(res.result).to.contain('.cssTest');
                done();
            });
        });
    });

    it('ignores methods', (done) => {

        const server = new Hapi.Server();
        server.connection();

        server.route(require('./routes/default'));

        internals.bootstrapServer(server, {
            register: require('../'),
            options: {
                filterRoutes(route) {

                    return route.method !== 'delete' && route.path !== '/test';
                }
            }
        }, (err) => {

            expect(err).not.to.exist();
            server.inject('/docs', (res) => {

                expect(res.result).to.not.contain('?server=http://test&path=/test');
                expect(res.result).to.not.contain('#DELETE');
                done();
            });
        });
    });
});


describe('Multiple connections', () => {

    let server = null;

    before((done) => {

        server = new Hapi.Server();
        server.connection({ host: 'test', port: 1, labels: 'c1' });
        server.connection({ host: 'test', port: 2, labels: 'c2' });

        server.route(require('./routes/default'));

        internals.bootstrapServer(server, require('../'), done);
    });

    it('should load all the servers routes', (done) => {

        server.connections[0].inject('/docs', (res) => {

            const tables = server.table();
            expect(tables).to.have.length(2);
            tables.forEach((connection) => {

                expect(res.result).to.contain(connection.info.uri);

                connection.table.forEach((route) => {

                    if ((route.settings.plugins && (route.settings.plugins.lout === false || route.settings.isInternal)) ||
                        route.path === '/docs' ||
                        route.method === 'options') {

                        expect(res.result).to.not.contain(`?server=${connection.info.uri}&path=${route.path}`);
                    }
                    else {
                        expect(res.result).to.contain(`?server=${connection.info.uri}&path=${route.path}`);
                    }
                });
            });
            done();
        });
    });

    it('should only show one server if parameter is there', (done) => {

        server.connections[0].inject('/docs?server=http://test:1', (res) => {

            const table = server.table();
            expect(table).to.have.length(2);

            let table1;
            let table2;
            table.forEach((connection) => {

                const uri = connection.info.uri;
                if (uri === 'http://test:1') {
                    table1 = connection.table;
                }
                else if (uri === 'http://test:2') {
                    table2 = connection.table;
                }
            });

            expect(res.result).to.contain('http://test:1');
            table1.forEach((route) => {

                if ((route.settings.plugins && (route.settings.plugins.lout === false || route.settings.isInternal)) ||
                    route.path === '/docs' ||
                    route.method === 'options') {

                    expect(res.result).to.not.contain(`?server=http://test:1&path=${route.path}`);
                }
                else {
                    expect(res.result).to.contain(`?server=http://test:1&path=${route.path}`);
                }
            });

            expect(res.result).to.not.contain('http://test:2');
            table2.forEach((route) => expect(res.result).to.not.contain(`?server=http://test:2&path=${route.path}`));

            done();
        });
    });
});

describe('Select connections', () => {

    let server;
    const selected = ['c2'];
    const unselected = ['c1'];

    before((done) => {

        server = new Hapi.Server();
        server.connection({ host: 'test', port: 1, labels: 'c1' });
        server.connection({ host: 'test', port: 2, labels: 'c2' });

        server.route(require('./routes/default'));

        internals.bootstrapServer(server, require('../'), { select: 'c2' }, done);
    });

    it('should load all the selected servers routes', (done) => {

        server.select(selected).inject('/docs', (res) => {

            const selectedTables = server.select(selected).table();
            const unselectedTables = server.select(unselected).table();
            expect(selectedTables).to.have.length(1);
            expect(unselectedTables).to.have.length(1);
            selectedTables.forEach((connection) => {

                expect(res.result).to.contain(connection.info.uri);

                connection.table.forEach((route) => {

                    if ((route.settings.plugins && (route.settings.plugins.lout === false || route.settings.isInternal)) ||
                        route.path === '/docs' ||
                        route.method === 'options') {

                        expect(res.result).to.not.contain(`?server=${connection.info.uri}&path=${route.path}`);
                    }
                    else {
                        expect(res.result).to.contain(`?server=${connection.info.uri}&path=${route.path}`);
                    }
                });
            });

            unselectedTables.forEach((connection) => expect(res.result).to.not.contain(connection.info.uri));

            done();
        });
    });
});

describe('Multiple paths', () => {

    it('should show separate paths', (done) => {

        const server = new Hapi.Server();
        server.connection({ host: 'test' });
        server.route({
            method: 'GET',
            path: '/v1/test',
            handler() {}
        });
        server.route({
            method: 'GET',
            path: '/v2/test',
            handler() {}
        });
        server.route({
            method: 'GET',
            path: '/another',
            handler() {}
        });

        internals.bootstrapServer(server, [{
            register: require('../'),
            options: {
                endpoint: '/docs/v1',
                filterRoutes(route) {

                    return /^\/v1/.test(route.path);
                }
            }
        }, {
            register: require('../'),
            options: {
                endpoint: '/docs/v2',
                filterRoutes(route) {

                    return /^\/v2/.test(route.path);
                }
            }
        }], (err) => {

            expect(err).to.not.exist();

            const routes = server.table();
            expect(routes[0].table).to.have.length(7); // 3 routes, 2 docs routes, 2 css routes

            server.inject('/docs/v1', (resv1) => {

                const $ = Cheerio.load(resv1.result);
                expect($('.route-index > a').length).to.equal(1);
                expect($('.route-index > a').attr('href')).to.equal('?server=http://test&path=/v1/test#GET');

                server.inject('/docs/v2', (resv2) => {

                    const $$ = Cheerio.load(resv2.result);
                    expect($$('.route-index > a').length).to.equal(1);
                    expect($$('.route-index > a').attr('href')).to.equal('?server=http://test&path=/v2/test#GET');

                    server.inject('/docs', (res) => {

                        expect(res.statusCode).to.equal(404);
                        done();
                    });
                });
            });
        });
    });
});
