// Load modules

var Chai = require('chai');
var Lout = process.env.TEST_COV ? require('../lib-cov') : require('../lib');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Chai.expect;


describe('Lout', function () {

    var indexTemplate = '<html>index{{#each routes}}{{this.method}}{{/each}}</html>';
    var routeTemplate = '<html>route{{#each routes}}{{this.method}}{{/each}}</html>';

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
    });
});