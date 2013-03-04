// Load modules

var Boom = require('boom');
var Joi = require('joi');


// Declare internals

var internals = {};

exports.docs = function (lout) {

    return {
        validate: {
            query: {
                path: Joi.types.String()
            }
        },
        handler: function () {

            var self = this;

            var routes = routes = this.server.routingTable();
            routes = routes.filter(function (item) {

                if (self.query.path &&
                    item.path !== self.query.path) {

                    return false;
                }

                return item.settings.plugins.lout !== false && item.method !== 'options';
            });

            if (!routes.length) {
                return this.reply(Boom.notFound());
            }

            routes.sort(function (route1, route2) {

                return route1.path > route2.path;
            });

            return this.reply(self.query.path ? lout.generateRoutesMarkup(routes) : lout.generateIndexMarkup(routes));
        },
        plugins: {
            lout: false
        }
    };
};