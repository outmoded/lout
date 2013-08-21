// Load modules

var Path = require('path');


// Declare internals

var internals = {
    defaults: {
        endpoint: '/docs',
        auth: false,
        indexTemplate: 'index',
        routeTemplate: 'route'
    }
};


exports.register = function (plugin, options, next) {

    var settings = plugin.hapi.utils.applyToDefaults(internals.defaults, options || {});

    plugin.views({ engines: { html: 'handlebars' }, path: './templates', basePath: settings.basePath });
    plugin.route({ method: 'GET', path: settings.endpoint, config: internals.docs(settings, plugin) });

    next();
};


internals.docs = function (settings, plugin) {

    return {
        auth: settings.auth,
        validate: {
            query: {
                path: plugin.hapi.types.String()
            }
        },
        handler: function (request) {

            var routes = request.server.routingTable();
            routes = routes.filter(function (item) {

                if (request.query.path &&
                    item.path !== request.query.path) {

                    return false;
                }

                return item.settings.plugins.lout !== false && item.method !== 'options';
            });

            if (!routes.length) {
                return request.reply(plugin.hapi.error.notFound());
            }

            routes.sort(function (route1, route2) {

                if (route1.path > route2.path) {
                    return 1;
                }
                if (route1.path < route2.path) {
                    return -1;
                }
                return 0;
            });

            if (request.query.path) {
                var templateData = internals.getRoutesData(routes);
                templateData.path = routes[0] ? routes[0].path : '/';

                return request.reply.view(settings.routeTemplate, templateData);
            }

            return request.reply.view(settings.indexTemplate, internals.getRoutesData(routes));
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
            description: route.settings.description,
            notes: route.settings.notes,
            tags: route.settings.tags,
            queryParams: internals.getParamsData(route.settings.validate && route.settings.validate.query),
            payloadParams: internals.getParamsData(route.settings.validate && route.settings.validate.payload),
            responseParams: internals.getParamsData(route.settings.validate && route.settings.validate.response && route.settings.validate.response.schema)
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