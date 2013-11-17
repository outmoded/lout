'use strict';

// Load modules

// Declare internals

var internals = {
    defaults: {
        engines: { html: 'handlebars' },
        endpoint: '/docs',
        auth: false,
        indexTemplate: 'index',
        routeTemplate: 'route'
    }
};


exports.register = function (plugin, options, next) {

    var settings = plugin.hapi.utils.applyToDefaults(internals.defaults, options || {});

    plugin.views({ engines: settings.engines, path: './templates', basePath: settings.basePath, partialsPath: './templates' });
    plugin.route({ method: 'GET', path: settings.endpoint, config: internals.docs(settings, plugin) });

    next();
};


internals.docs = function (settings, plugin) {

    return {
        auth: settings.auth,
        validate: {
            query: {
                path: plugin.hapi.types.string()
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
                var templateData = internals.getRoutesData(routes, plugin.hapi.types);
                templateData.path = routes[0] ? routes[0].path : '/';

                return request.reply.view(settings.routeTemplate, templateData);
            }

            return request.reply.view(settings.indexTemplate, internals.getRoutesData(routes, plugin.hapi.types));
        },
        plugins: {
            lout: false
        }
    };
};


internals.getRoutesData = function (routes, types) {

    var routesData = [];
    routes.forEach(function (route) {

        routesData.push({
            path: route.path,
            method: route.method.toUpperCase(),
            description: route.settings.description,
            notes: route.settings.notes,
            tags: route.settings.tags,
            auth: route.settings.auth && route.settings.auth.strategies,
            pathParams: internals.describe(route.settings.validate && route.settings.validate.path, types),
            queryParams: internals.describe(route.settings.validate && route.settings.validate.query, types),
            payloadParams: internals.describe(route.settings.validate && route.settings.validate.payload, types),
            responseParams: internals.describe(route.settings.response && route.settings.response.schema, types)
        });
    });

    return { routes: routesData };
};


internals.describe = function (params, types) {

    if (params === null ||
        params === undefined ||
        (typeof params !== 'object')) {

        return [];
    }

    if (!(params instanceof types.any().constructor)) {

        params = types.object(params);
    }

    var description = (params.describe || params._describe).call(params);
    return internals.getParamsData(description);
};


internals.getParamsData = function (param, name) {

    var data = {
        name: name,
        description: typeof param.description === 'function' ? '' : param.description,
        notes: typeof param.notes === 'function' ? '' : param.notes,
        tags: typeof param.tags === 'function' ? '' : param.tags,
        type: param.type,
        required: param.invalids ? param.invalids.indexOf(undefined) !== -1 : null,
        allowedValues: param.valids ? internals.getExistsValues(param.valids) : null,
        disallowedValues: param.invalids ? internals.getExistsValues(param.invalids) : null
    };

    if (data.type === 'object') {

        var childrenKeys = Object.keys(param.children);
        data.children = childrenKeys.map(function (key) {

            return internals.getParamsData(param.children[key], key);
        });
    }

    return data;
};


internals.getExistsValues = function (exists) {

    var values = exists.filter(function (value) {
        return value !== null &&
            value !== undefined &&
            (typeof value === 'string' && value.length !== 0);
    });

    return values.length ? values : null;
};
