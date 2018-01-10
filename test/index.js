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
    async bootstrapServer(server, plugins, options) {

        try {
            await server.register([Inert, Vision].concat(plugins), options);
            await server.initialize();

            return;
        }
        catch (err) {
            throw err;
        }
    }
};

// Test shortcuts

const lab = exports.lab = Lab.script();
const before = lab.before;
const describe = lab.experiment;
const it = lab.test;
const expect = lab.expect;

describe('Registration', () => {

    it('should register', async () => {

        const server = Hapi.server();

        await internals.bootstrapServer(server, require('../'));

        const routes = server.table();
        expect(routes).to.have.length(2);
    });

    it('should register with options', async () => {

        const server = Hapi.server();

        try {
            await internals.bootstrapServer(server, {
                plugin: require('../'),
                options: {
                    helpersPath: Path.join(__dirname, '../templates/helpers'),
                    cssPath: null,
                    endpoint: '/'
                }
            });
        }
        catch (err) {
            expect(err).to.not.exist();
        }

        const routes = server.table();
        expect(routes).to.have.length(1);
    });

    it('should fail to register with bad options', async () => {

        const server = Hapi.server();

        try {
            await internals.bootstrapServer(server, {
                plugin: require('../'),
                options: {
                    foo: 'bar'
                }
            });
        }
        catch (err) {
            expect(err).to.exist();
            expect(err.message).to.equal('"foo" is not allowed');
        }
    });


    it('should register with malformed endpoint', async () => {

        const server = Hapi.server();

        try {
            await internals.bootstrapServer(server, {
                plugin: require('../'),
                options: {
                    endpoint: 'api/'
                }
            });
        }
        catch (err) {
            expect(err).to.not.exist();
        }

        const routes = server.table();
        const endpoints = routes;
        expect(endpoints).to.have.length(2);
        expect(endpoints).to.part.include([{ path: '/api' }, { path: '/api/css/{path*}' }]);
    });
});

describe('Lout', () => {

    let server;

    before(() => {

        server = Hapi.server();

        server.route(require('./routes/default'));

        internals.bootstrapServer(server, require('../'));

    });

    it('shows template when correct path is provided', async () => {

        const res = await server.inject('/docs?path=/test');

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
    });

    it('shows array objects', async () => {

        const res = await server.inject('/docs?path=/rootarray');

        const $ = Cheerio.load(res.result);

        expect($('.type-header').length).to.equal(5);
    });

    it('shows alternatives', async () => {

        const res = await server.inject('/docs?path=/alternatives');

        expect(res.result).to.contain('field-alternatives');
        expect(res.result).to.contain('number');
        expect(res.result).to.contain('one of');
        expect(res.result).to.contain('first');
        expect(res.result).to.contain('last');
    });

    it('shows a single value with only one valid', async () => {

        const res = await server.inject('/docs?path=/only-one-valid');

        expect(res.result).to.contain('onlyvalid');
    });

    it('shows multiple values with multiple valids', async () => {

        const res = await server.inject('/docs?path=/multiple-valids');

        expect(res.result).to.contain('must be one of');
        expect(res.result).to.contain('onlyvalid');
        expect(res.result).to.contain('metoo');
    });

    it('shows a single value on a single allow', async () => {

        const res = await server.inject('/docs?path=/single-allow');

        expect(res.result).to.contain('string');
        expect(res.result).to.contain('can also be');
        expect(res.result).to.contain('alsoallow');
    });

    it('shows multiple values on multiple allows', async () => {

        const res = await server.inject('/docs?path=/multiple-allows');

        expect(res.result).to.contain('number');
        expect(res.result).to.contain('can also be one of');
        expect(res.result).to.contain('null');
        expect(res.result).to.contain('alsoallow');
    });

    it('returns a Not Found response when wrong path is provided', async () => {

        const res = await server.inject('/docs?path=blah');

        expect(res.result.error).to.equal('Not Found');
    });

    it('displays the index if no path is provided', async () => {

        const res = await server.inject('/docs');

        server.table().forEach((route) => {

            if ((route.settings.plugins && (route.settings.plugins.lout === false || route.settings.isInternal)) ||
                route.path === '/docs' ||
                route.method === 'options') {

                expect(res.result).to.not.contain(`?path=${route.path}`);
            }
            else {
                expect(res.result).to.contain(`?path=${route.path}`);
            }
        });
    });

    it('displays the index even with an unknown query param', async () => {

        const res = await server.inject('/docs?foo=bar');

        server.table().forEach((route) => {

            if ((route.settings.plugins && (route.settings.plugins.lout === false || route.settings.isInternal)) ||
                route.path === '/docs' ||
                route.method === 'options') {

                expect(res.result).to.not.contain(`?path=${route.path}`);
            }
            else {
                expect(res.result).to.contain(`?path=${route.path}`);
            }
        });
    });

    it('index doesn\'t have the docs endpoint listed', async () => {

        const res = await server.inject('/docs');

        expect(res.result).to.not.contain('?path=/docs');
    });

    it('index doesn\'t include routes that are configured with docs disabled', async () => {

        const res = await server.inject('/docs');

        expect(res.result).to.not.contain('/notincluded');
    });

    it('displays nested rules', async () => {

        const res = await server.inject('/docs?path=/nested');

        expect(res.result).to.contain('param1');
        expect(res.result).to.contain('nestedparam1');
        expect(res.result).to.contain('icon-star');
    });

    it('displays path parameters', async () => {

        const res = await server.inject('/docs?path=/path/{pparam}/test');

        expect(res.result).to.contain('Path Parameters');
        expect(res.result).to.contain('pparam');
        expect(res.result).to.contain('icon-star');
    });

    it('should not show properties on empty objects', async () => {

        const res = await server.inject('/docs?path=/emptyobject');

        expect(res.result).to.contain('param1');
        expect(res.result.match(/list-children/g)).to.have.length(2);
    });

    it('should show routes without any validation', async () => {

        const res = await server.inject('/docs?path=/novalidation');

        expect(res.result).to.not.contain('Parameters');
    });

    it('should handle invalid array of rules', async () => {

        const res = await server.inject('/docs?path=/withnestedrulesarray');

        expect(res.result).to.contain('Request Parameters');
    });

    it('should show html notes', async () => {

        const res = await server.inject('/docs?path=/withhtmlnote');

        const $ = Cheerio.load(res.result);
        expect($('.htmlroutenote').length).to.equal(1);
        expect($('.htmltypenote').length).to.equal(1);
    });

    it('should show note arrays', async () => {

        const res = await server.inject('/docs?path=/withnotesarray');

        const $ = Cheerio.load(res.result);
        expect($('.htmltypenote').length).to.equal(2);
    });

    it('should show example', async () => {

        const res = await server.inject('/docs?path=/withexample');

        const $ = Cheerio.load(res.result);
        expect($('.example').length).to.equal(1);
    });

    it('should support multiple nested examples', async () => {

        const res = await server.inject('/docs?path=/withnestedexamples');

        const $ = Cheerio.load(res.result);
        expect($('.example').length).to.equal(3);
    });

    it('should support "false" as validation rule', async () => {

        const res = await server.inject('/docs?path=/denybody');

        expect(res.result).to.contain('Denied');
    });

    it('should not detect "false" on an empty object', async () => {

        const res = await server.inject('/docs?path=/rootemptyobject');

        expect(res.result).to.not.contain('Denied');
    });

    it('should show meta informations', async () => {

        const res = await server.inject('/docs?path=/withmeta');

        const $ = Cheerio.load(res.result);
        expect($('.field-meta pre code').length).to.equal(1);
    });

    it('should show units', async () => {

        const res = await server.inject('/docs?path=/withunit');

        expect(res.result).to.contain('Unit');
        expect(res.result).to.contain('ms');
    });

    it('should show default values', async () => {

        const res = await server.inject('/docs?path=/withdefaultvalue');

        const $ = Cheerio.load(res.result);
        expect($('dt.default-value').length).to.equal(2);
        expect($('dd.default-value').length).to.equal(2);
        expect($('dt.default-value').first().text()).to.equal('Default value');
        expect($('dt.default-value').last().text()).to.equal('Default value');
        expect($('dd.default-value').first().text()).to.equal('42');
        expect($('dd.default-value').last().text()).to.equal('false');
    });

    it('should show default values as function', async () => {

        const res = await server.inject('/docs?path=/withdefaultvaluefn');

        const $ = Cheerio.load(res.result);
        expect($('dt.default-value').text()).to.equal('Default value');
        expect($('dd.default-value').text()).to.equal('"default test"');
    });

    it('should show binary types encoding', async () => {

        const res = await server.inject('/docs?path=/withbinaryencoding');

        const $ = Cheerio.load(res.result);
        expect($('dt.encoding').text()).to.equal('Encoding');
        expect($('dd.encoding').text()).to.equal('base64');
        expect($('dt.rules-Min').text()).to.equal('Min');
        expect($('dd.rules-Min').text()).to.contain('42');
        expect($('dt.rules-Max').text()).to.equal('Max');
        expect($('dd.rules-Max').text()).to.contain('128');
        expect($('dt.rules-Length').text()).to.equal('Length');
        expect($('dd.rules-Length').text()).to.contain('64');
    });

    it('should show dates with min and max', async () => {

        const res = await server.inject('/docs?path=/withdate');

        const $ = Cheerio.load(res.result);
        expect($('dt.rules-Min').text()).to.equal('Min');
        expect($('dd.rules-Min').text().replace(/\n|\s+/g, '')).to.not.be.empty();
        expect($('dt.rules-Max').text()).to.equal('Max');
        expect($('dd.rules-Max').text().replace(/\n|\s+/g, '')).to.not.be.empty();
    });

    it('should show peer dependencies', async () => {

        const res = await server.inject('/docs?path=/withpeersconditions');

        expect(res.result).to.contain('Requires a and b and c.');
        expect(res.result).to.contain('Requires a or b or c.');
        expect(res.result).to.contain('Requires a xor b xor c.');
        expect(res.result).to.contain('Requires b, c to be present when a is.');
        expect(res.result).to.contain('Requires b, c to not be present when a is.');
    });

    it('should show pattern on objects', async () => {

        const res = await server.inject('/docs?path=/withpattern');

        expect(res.result).to.contain('/\\w\\d/');
        expect(res.result).to.contain('boolean');
    });

    it('should show peer dependencies', async () => {

        const res = await server.inject('/docs?path=/withallowunknown');

        const $ = Cheerio.load(res.result);
        expect($('.allow-unknown').length).to.equal(1);
    });

    it('should show case insensitive string', async () => {

        const res = await server.inject('/docs?path=/test');

        const $ = Cheerio.load(res.result);
        expect($('.case-insensitive').length).to.equal(1);
    });

    it('should not show forbidden values for simple numbers', async () => {

        const res = await server.inject('/docs?path=/test');

        const $ = Cheerio.load(res.result);
        expect($('.field-forbidden-values').text()).to.equal('none of"second"');
    });

    it('should support string specifics', async () => {

        const res = await server.inject('/docs?path=/withstringspecifics');

        const $ = Cheerio.load(res.result);
        const ddRules = 'dt.rules-';
        const rulesSelector = ddRules + ['Alphanum', 'Regex', 'Token', 'Email', 'Guid', 'IsoDate', 'Hostname',
            'Lowercase', 'Uppercase', 'Trim'
        ].join(`,${ddRules}`);
        const regexps = $('dd.rules-Regex');
        expect(regexps.length).to.equal(2);
        expect(regexps.first().text()).to.contain('/\\d{3}.*/');
        expect(regexps.last().text()).to.contain('/foo/ (No foo !) - inverted');
        expect($(rulesSelector).length).to.equal(12);
    });

    it('should support conditional alternatives', async () => {

        const res = await server.inject('/docs?path=/withconditionalalternatives');

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
    });

    it('should support references', async () => {

        const res = await server.inject('/docs?path=/withreferences');

        const $ = Cheerio.load(res.result);
        expect($('dd.ref-target').text())
            .to.contain('a.b')
            .to.contain('$x');
    });

    it('should support assertions', async () => {

        const res = await server.inject('/docs?path=/withassert');

        const $ = Cheerio.load(res.result);
        expect($('.assertion-text').text().replace(/\n|\s+/g, ''))
            .to.contain('Assertsthatd.ematchesthefollowingmodel')
            .to.contain('Assertsthat$xmatchesthefollowingmodel');
        expect($('dd.ref-target').text())
            .to.contain('a.c')
            .to.contain('b.e');
    });

    it('should show properties of the route', async () => {

        const res = await server.inject('/docs?path=/withproperties');

        const $ = Cheerio.load(res.result);
        expect($('p.vhost').text()).to.equal('john.doe');
        expect($('dd.cors-maxAge').text()).to.equal('12345');
        expect($('p.jsonp').text()).to.equal('callback');
    });

    it('should handle cors: true', async () => {

        const res = await server.inject('/docs?path=/withcorstrue');

        const $ = Cheerio.load(res.result);
        expect($('h3.cors').text()).to.equal('CORS');
        expect($('dd.cors-maxAge').text()).to.equal('86400');
    });

    it('should support references in rules', async () => {

        const res = await server.inject('/docs?path=/withrulereference');

        const $ = Cheerio.load(res.result);
        expect($('.rules-Min .reference').text()).to.equal('param2');
    });

    it('should remove stripped fields', async () => {

        const res = await server.inject('/docs?path=/withstrip');

        const $ = Cheerio.load(res.result);
        expect($('.glyphicon-trash')).to.have.length(1);
    });

    it('should not show internal routes', async () => {

        const resRoot = await server.inject('/docs');
        expect(resRoot.result).to.not.contain('/result');

        const resPath = await server.inject('/docs?path=/internal');
        expect(resPath.statusCode).to.equal(404);
    });


    it('should support status schema', async () => {

        const res = await server.inject('/docs?path=/withstatus');

        const $ = Cheerio.load(res.result);
        expect($('.collapse').text())
            .to.contain('204')
            .to.contain('param2')
            .to.contain('404')
            .to.contain('Failure');
    });


    describe('Authentication', () => {

        before(() => {

            server = Hapi.server();

            server.auth.scheme('testScheme', () => ({
                async authenticate() {},
                async payload() {},
                async response() {}
            }));
            server.auth.strategy('testStrategy', 'testScheme');
            server.auth.default('testStrategy');

            server.route(require('./routes/withauth'));
            internals.bootstrapServer(server, require('../'));
        });

        it('should display authentication information', async () => {

            const res = await server.inject('/docs?path=/withauth');

            expect(res).to.exist();
            expect(res.result).to.contain('Strategies');
        });

        it('should display authentication information with an object', async () => {

            const res = await server.inject('/docs?path=/withauthasobject');

            const $ = Cheerio.load(res.result);
            expect($('p.auth-strategies').text()).to.equal('testStrategy');
            expect($('p.auth-mode').text()).to.equal('try');
            expect($('p.auth-payload').text()).to.equal('optional');
            expect($('p.auth-scope').text()).to.equal('test');
            expect($('p.auth-entity').text()).to.equal('user');
        });

        it('should display authentication information with multiple access', async () => {

            const res = await server.inject('/docs?path=/withmultipleaccess');

            const $ = Cheerio.load(res.result);
            expect($('p.auth-strategies').text()).to.equal('testStrategy');
            expect($('p.auth-mode').text()).to.equal('try');
            expect($('p.auth-payload').text()).to.equal('optional');
            expect($('p.auth-scope').text()).to.equal('bc,daabcd');
            expect($('p.auth-entity').text()).to.equal('userany');
        });

        it('should display authentication information with a default auth', async () => {

            const res = await server.inject('/docs?path=/withimplicitauth');

            const $ = Cheerio.load(res.result);
            expect($('p.auth-strategies').text()).to.equal('testStrategy');
            expect($('p.auth-mode').text()).to.equal('required');
            expect($('p.auth-payload').length).to.equal(0);
            expect($('p.auth-scope').length).to.equal(0);
            expect($('p.auth-entity').length).to.equal(0);
        });
    });

    describe('Index', () => {

        it('doesn\'t throw an error when requesting the index when there are no POST routes', async () => {

            server = Hapi.server();

            server.route(require('./routes/withoutpost'));

            try {
                await internals.bootstrapServer(server, require('../'));
            }
            catch (err) {
                expect(err).to.not.exist();
            }

            const res = await server.inject('/docs');

            expect(res).to.exist();
            expect(res.result).to.contain('/test');
        });
    });
});

describe('Customized Lout', () => {

    it('should succeed with a basePath without helpers', () => {

        const server = Hapi.server();

        internals.bootstrapServer(server, {
            plugin: require('../'),
            options: {
                basePath: Path.join(__dirname, './custom-test-files')
            }
        });
    });

    it('should succeed with an apiVersion', async () => {

        const server = Hapi.server();
        server.route(require('./routes/default'));

        try {
            await internals.bootstrapServer(server, {
                plugin: require('../'),
                options: {
                    apiVersion: '3.3.3'
                }
            });
        }
        catch (err) {
            expect(err).to.not.exist();
        }

        const res = await server.inject('/docs');

        expect(res).to.exist();
        const $ = Cheerio.load(res.result);
        expect($('a.navbar-brand').text()).to.match(/v3\.3\.3$/);
    });

    it('should succeed with a correct configuration', () => {

        const server = Hapi.server();

        internals.bootstrapServer(server, {
            plugin: require('../'),
            options: {
                basePath: Path.join(__dirname, './custom-test-files'),
                helpersPath: Path.join(__dirname, '../templates/helpers'),
                cssPath: null
            }
        });
    });

    it('should succeed with a custom engine', () => {

        const server = Hapi.server();

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
            plugin: require('../'),
            options
        });
    });

    it('should serve a custom css', async () => {

        const server = Hapi.server();

        try {
            await internals.bootstrapServer(server, {
                plugin: require('../'),
                options: {
                    cssPath: Path.join(__dirname, './custom-test-files/css')
                }
            });
        }
        catch (err) {
            expect(err).not.to.exist();
        }

        const res = await server.inject('/docs/css/style.css');

        expect(res).to.exist();
        expect(res.result).to.contain('.cssTest');
    });

    it('ignores methods', async () => {

        const server = Hapi.server();

        server.route(require('./routes/default'));

        try {
            await internals.bootstrapServer(server, {
                plugin: require('../'),
                options: {
                    filterRoutes(route) {

                        return route.method !== 'delete' && route.path !== '/test';
                    }
                }
            });
        }
        catch (err) {
            expect(err).not.to.exist();
        }

        const res = await server.inject('/docs');

        expect(res.result).to.not.contain('?path=/test');
        expect(res.result).to.not.contain('#DELETE');
    });
});

describe('Multiple paths', () => {

    it('should show separate paths', async () => {

        const server = Hapi.server();

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

        try {
            await internals.bootstrapServer(server, [{
                plugin: require('../'),
                options: {
                    endpoint: '/docs/v1',
                    filterRoutes(route) {

                        return /^\/v1/.test(route.path);
                    }
                }
            }, {
                plugin: require('../'),
                options: {
                    endpoint: '/docs/v2',
                    filterRoutes(route) {

                        return /^\/v2/.test(route.path);
                    }
                }
            }]);
        }
        catch (err) {
            expect(err).to.not.exist();
        }

        const routes = server.table();
        expect(routes).to.have.length(7); // 3 routes, 2 docs routes, 2 css routes

        const resv1 = await server.inject('/docs/v1');

        const $ = Cheerio.load(resv1.result);
        expect($('.route-index > a').length).to.equal(1);
        expect($('.route-index > a').attr('href')).to.equal('?path=/v1/test#GET');

        const resv2 = await server.inject('/docs/v2');

        const $$ = Cheerio.load(resv2.result);
        expect($$('.route-index > a').length).to.equal(1);
        expect($$('.route-index > a').attr('href')).to.equal('?path=/v2/test#GET');

        const res = await server.inject('/docs');

        expect(res.statusCode).to.equal(404);
    });
});
