// Load modules

var Boom = require('boom');
var Joi = require('joi');


// Declare internals

var internals = {};

exports.docs = function (lout) {

    return {
        query: {
            path: Joi.types.String()
        },
        handler: function () {

            var routes = [];

            if (this.query.path) {
                var path = this.query.path;

                routes.push(this.server._match('get', path));
                routes.push(this.server._match('post', path));
                routes.push(this.server._match('delete', path));
                routes.push(this.server._match('put', path));
                routes.push(this.server._match('*', path));

                routes = routes.filter(function (item) {

                    return item && item.config.docs !== false;
                });

                if (!routes.length) {
                    return this.reply(Boom.notFound());
                }

                return this.reply(lout.generateRoutesMarkup(routes));
            }

            routes = this.server._routeTable();
            routes = routes.filter(function (item) {

                return item && item.config.docs !== false && item.method !== 'options';
            });

            routes.sort(function (route1, route2) {

                return route1.path > route2.path;
            });

            return this.reply(lout.generateIndexMarkup(routes));
        },
        docs: false
    };
};