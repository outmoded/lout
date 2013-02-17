// Load modules

var Chai = require('chai');
var Joi = require('joi');
var Lout = require('../lib/lout');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Chai.expect;


describe('Lout', function () {

    var indexTemplate = '<html>index{{#each routes}}{{this.method}}{{/each}}</html>';
    var routeTemplate = '<html>route{{#each routes}}{{this.method}}{{/each}}</html>';
    var routeTemplateWithQuery = '<html>{{#each routes}}{{#each this.queryParams}}{{this.required}}{{/each}}{{/each}}</html>';
    var routeTemplateWithAllowed = '<html>{{#each routes}}{{#each this.queryParams}}{{#each this.allowedValues}}{{this}}{{/each}}{{/each}}{{/each}}</html>';
    var routeTemplateWithDenied = '<html>{{#each routes}}{{#each this.queryParams}}{{#each this.disallowedValues}}{{this}}{{/each}}{{/each}}{{/each}}</html>';

    describe('#constructor', function () {

        it('cannot be constructed without new', function (done) {

            var fn = function () {

                var lout = Lout();
            };

            expect(fn).to.throw(Error);
            done();
        });

        it('can be constructed with new', function (done) {

            var fn = function () {

                var lout = new Lout({
                    indexTemplate: indexTemplate,
                    routeTemplate: routeTemplate
                });
            };

            expect(fn).to.not.throw(Error);
            done();
        });

        it('uses the lout defaults when no config is passed in', function (done) {

            var lout = new Lout();

            expect(lout._compiledIndexTemplate).to.exist;
            expect(lout._compiledRouteTemplate).to.exist;
            done();
        });

        it('uses the passed in config', function (done) {

            var lout = new Lout({
                indexTemplate: indexTemplate,
                routeTemplate: routeTemplate
            });

            expect(lout._compiledIndexTemplate({ routes: [] })).to.equal('<html>index</html>');
            expect(lout._compiledRouteTemplate({ routes: [] })).to.equal('<html>route</html>');
            done();
        });
    });

    describe('#generateIndexMarkup', function () {

        it('returns an error when routes isn\'t an array', function (done) {

            var lout = new Lout({
                indexTemplate: indexTemplate,
                routeTemplate: routeTemplate
            });

            var fn = function () {

                lout.generateIndexMarkup(null);
            };

            expect(fn).to.throw(Error);
            done();
        });

        it('returns the appropriate markup when routes are correct', function (done) {

            var lout = new Lout({
                indexTemplate: indexTemplate,
                routeTemplate: routeTemplate
            });

            var markup = lout.generateIndexMarkup([{
                method: 'GET'
            }]);

            expect(markup).to.equal('<html>indexGET</html>');
            done();
        });
    });

    describe('#generateRoutesMarkup', function () {

        it('returns an error when routes isn\'t an array', function (done) {

            var lout = new Lout({
                indexTemplate: indexTemplate,
                routeTemplate: routeTemplate
            });

            var fn = function () {

                lout.generateRoutesMarkup(null);
            };

            expect(fn).to.throw(Error);
            done();
        });

        it('returns the appropriate markup when routes are correct', function (done) {

            var lout = new Lout({
                indexTemplate: indexTemplate,
                routeTemplate: routeTemplate
            });

            var markup = lout.generateRoutesMarkup([{
                method: 'GET'
            }]);

            expect(markup).to.equal('<html>routeGET</html>');
            done();
        });

        it('handles a null route safely', function (done) {

            var lout = new Lout({
                indexTemplate: indexTemplate,
                routeTemplate: routeTemplate
            });

            var markup = lout.generateRoutesMarkup([null]);

            expect(markup).to.equal('<html>route</html>');
            done();
        });

        describe('getting params data', function () {

            it('processes a non-object validation property', function (done) {

                var lout = new Lout({
                    indexTemplate: indexTemplate,
                    routeTemplate: routeTemplate
                });

                var markup = lout.generateRoutesMarkup([{
                    method: 'POST',
                    config: { validate: { query: 'test' } }
                }]);

                expect(markup).to.equal('<html>routePOST</html>');
                done();
            });

            it('processes an empty object validation property', function (done) {

                var lout = new Lout({
                    indexTemplate: indexTemplate,
                    routeTemplate: routeTemplate
                });

                var markup = lout.generateRoutesMarkup([{
                    method: 'POST',
                    config: { validate: { query: {} } }
                }]);

                expect(markup).to.equal('<html>routePOST</html>');
                done();
            });

            it('processes a query validation object with required', function (done) {

                var lout = new Lout({
                    indexTemplate: indexTemplate,
                    routeTemplate: routeTemplateWithQuery
                });

                var markup = lout.generateRoutesMarkup([{
                    method: 'POST',
                    config: { validate: { query: { username: Joi.Types.String().required() } } }
                }]);

                expect(markup).to.equal('<html>true</html>');
                done();
            });

            it('processes a query validation object with allowed values', function (done) {

                var lout = new Lout({
                    indexTemplate: indexTemplate,
                    routeTemplate: routeTemplateWithAllowed
                });

                var markup = lout.generateRoutesMarkup([{
                    method: 'POST',
                    config: { validate: { query: { username: Joi.Types.String().allow('hello').allow('hi') } } }
                }]);

                expect(markup).to.equal('<html>hellohi</html>');
                done();
            });

            it('processes a query validation object with denied values', function (done) {

                var lout = new Lout({
                    indexTemplate: indexTemplate,
                    routeTemplate: routeTemplateWithDenied
                });

                var markup = lout.generateRoutesMarkup([{
                    method: 'POST',
                    config: { validate: { query: { username: Joi.Types.String().deny('test') } } }
                }]);

                expect(markup).to.equal('<html>test</html>');
                done();
            });

            it('processes a query validation object that has with', function (done) {

                var lout = new Lout({
                    indexTemplate: indexTemplate,
                    routeTemplate: routeTemplateWithDenied
                });

                var markup = lout.generateRoutesMarkup([{
                    method: 'POST',
                    config: { validate: { query: { username: Joi.Types.String().with('test') } } }
                }]);

                expect(markup).to.equal('<html></html>');
                done();
            });

            it('processes a validation object that is missing exists valids', function (done) {

                var lout = new Lout({
                    indexTemplate: indexTemplate,
                    routeTemplate: routeTemplateWithDenied
                });

                var markup = lout.generateRoutesMarkup([{
                    method: 'POST',
                    config: { validate: { query: { username: { __valids: { exists: null }} } } }
                }]);

                expect(markup).to.equal('<html></html>');
                done();
            });
        });
    });
});