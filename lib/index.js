// Load modules

var Fs = require('fs');
var NodeUtils = require('util');
var Hoek = require('hoek');
var Boom = require('boom');
var Joi = require('joi');
var Handlebars = require('handlebars');


// Declare internals

var internals = {
    defaults: {
        docsPath: '/docs',
        indexTemplatePath: __dirname + '/../templates/index.html',
        routeTemplatePath: __dirname + '/../templates/route.html'
    }
};


exports.register = function (pack, options, next) {

    var settings = Hoek.applyToDefaults(internals.defaults, options || {});

    var indexTemplateSource = settings.indexTemplate || Fs.readFileSync(settings.indexTemplatePath, 'utf8');
    var routeTemplateSource = settings.routeTemplate || Fs.readFileSync(settings.routeTemplatePath, 'utf8');

    var resources = {
        compiledIndexTemplate: Handlebars.compile(indexTemplateSource),
        compiledRouteTemplate: Handlebars.compile(routeTemplateSource)
    };

    pack.route({ method: 'GET', path: settings.docsPath, config: internals.docs(resources) });

    next();
};


internals.docs = function (resources) {

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

            if (self.query.path) {
                var templateData = internals.getRoutesData(routes);
                templateData.path = routes[0] ? routes[0].path : '/';
                return this.reply(resources.compiledRouteTemplate(templateData));
            }

            var templateData = internals.getRoutesData(routes);
            return this.reply(resources.compiledIndexTemplate(templateData));
        },
        plugins: {
            lout: false
        }
    };
};


internals.getRoutesData = function (routes) {

    var routesData = [];
    routes.forEach(function (route) {

        routesData.push({
            path: route.path,
            method: route.method.toUpperCase(),
            description: route.description,
            notes: route.notes,
            tags: route.tags,
            queryParams: internals.getParamsData(route.settings.validate && route.settings.validate.query),
            payloadParams: internals.getParamsData(route.settings.validate && route.settings.validate.schema),
            responseParams: internals.getParamsData(route.settings.response)
        });
    });

    return { routes: routesData };
};


internals.getParamsData = function (params) {

    if (params === null ||
        params === undefined ||
        (typeof params !== 'object')) {

        return [];
    }

    var paramsData = [];
    var keys = Object.keys(params);

    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        var param = params[key];

        paramsData.push({
            name: key,
            description: typeof param.description === 'function' ? '' : param.description,
            notes: typeof param.notes === 'function' ? '' : param.notes,
            tags: typeof param.tags === 'function' ? '' : param.tags,
            type: param.type,
            required: param.__modifiers && param.__modifiers._values ? param.__modifiers._values.some(internals.isRequiredParam) : null,
            allowedValues: param.__valids ? internals.getExistsValues(param.__valids._exists) : null,
            disallowedValues: param.__invalids ? internals.getExistsValues(param.__invalids._exists) : null
        });
    }

    return paramsData;
};


internals.getExistsValues = function (exists) {

    var values = [];

    var keys = Object.keys(exists);
    keys.forEach(function (key) {
        key = key.substring(1, key.length - 1);
        if (key !== 'ndefine' && key !== 'ul' && key.length !== 0) {
            values.push(key);
        }
    });

    return values;
};


internals.isRequiredParam = function (element) {

    return element === 'required';
};