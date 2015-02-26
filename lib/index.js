'use strict';

// Load modules
var Joi = require('joi');
var Boom = require('boom');
var Hoek = require('hoek');
var Path = require('path');
var Handlebars = require('handlebars');


// Declare internals

var internals = {
    defaults: {
        endpoint: '/docs',
        auth: false,
        basePath: Path.join(__dirname, '..', 'templates'),
        cssPath: Path.join(__dirname, '..', 'public', 'css'),
        helpersPath: Path.join(__dirname, '..', 'templates', 'helpers'),
        partialsPath: Path.join(__dirname, '..', 'templates'),
        indexTemplate: 'index',
        routeTemplate: 'route',
        methodsOrder: ['get', 'head', 'post', 'put', 'delete', 'trace'],
        filterRoutes: null
    },
    options: Joi.object({
        engines: Joi.object(),
        endpoint: Joi.string(),
        basePath: Joi.string(),
        cssPath: Joi.string().allow(null),
        helpersPath: Joi.string(),
        partialsPath: Joi.string(),
        auth: Joi.object(),
        indexTemplate: Joi.string(),
        routeTemplate: Joi.string(),
        filterRoutes: Joi.func()
    })
};


exports.register = function (server, options, next) {

    var validateOptions = internals.options.validate(options);
    if (validateOptions.error) {
        return next(validateOptions.error);
    }

    var settings = Hoek.clone(internals.defaults);
    Hoek.merge(settings, options);

    var cssBaseUrl = (settings.endpoint === '/' ? '' : settings.endpoint) + '/css';

    server.views({
        engines: settings.engines || {
            html: {
                module: Handlebars
            }
        },
        path: settings.basePath,
        partialsPath: settings.partialsPath,
        helpersPath: settings.helpersPath,
        runtimeOptions: {
            data: {
                cssBaseUrl: cssBaseUrl.replace(/(.*?)((\/\w+)?\/css)/, '$2')
            }
        }
    });

    server.route({
        method: 'GET',
        path: settings.endpoint,
        config: internals.docs(settings, server)
    });

    if (settings.cssPath) {
        server.route({
            method: 'GET',
            path: cssBaseUrl + '/{path*}',
            config: {
                handler: {
                    directory: {
                        path: settings.cssPath,
                        index: false,
                        listing: false
                    }
                },
                plugins: {
                    lout: false
                },
                auth: settings.auth
            }
        });
    }

    next();
};


exports.register.attributes = {
    pkg: require('../package.json'),
    multiple: true
};


internals.docs = function (settings, server) {

    return {
        auth: settings.auth,
        validate: {
            query: {
                path: Joi.string(),
                server: Joi.string()
            }
        },
        handler: function (request, reply) {

            var routingTable = server.table();
            var connections = [];

            routingTable.forEach(function (connection) {

                if (request.query.server && connection.info.uri !== request.query.server) {
                    return;
                }

                connection.table = connection.table.filter(function(item) {

                    if (request.query.path && item.path !== request.query.path) {

                        return false;
                    }

                    return item.settings.plugins.lout !== false &&
                        item.method !== 'options' &&
                        (!settings.filterRoutes || settings.filterRoutes({
                            method: item.method,
                            path: item.path,
                            connection: connection
                        }));
                }).sort(function (route1, route2) {

                    if (route1.path > route2.path) {
                        return 1;
                    }

                    if (route1.path < route2.path) {
                        return -1;
                    }

                    return settings.methodsOrder.indexOf(route1.method) - settings.methodsOrder.indexOf(route2.method);
                });

                connections.push(connection);
            });

            if (connections.every(function (connection) { return !connection.table.length; })) {
                return reply(Boom.notFound());
            }

            if (request.query.path && request.query.server) {
                return reply.view(settings.routeTemplate, internals.getRoutesData(connections[0].table));
            }

            return reply.view(settings.indexTemplate, internals.getConnectionsData(connections));
        },
        plugins: {
            lout: false
        }
    };
};


internals.getConnectionsData = function (connections) {

    connections.forEach(function (connection) {

        connection.table = internals.getRoutesData(connection.table);
    });

    return connections;
};


internals.getRoutesData = function (routes) {

    return routes.map(function (route) {

        return {
            path: route.path,
            method: route.method.toUpperCase(),
            description: route.settings.description,
            notes: route.settings.notes,
            tags: route.settings.tags,
            auth: route.settings.auth,
            vhost: route.settings.vhost,
            cors: route.settings.cors,
            jsonp: route.settings.jsonp,
            pathParams: internals.describe(route.settings.validate.params),
            queryParams: internals.describe(route.settings.validate.query),
            payloadParams: internals.describe(route.settings.validate.payload),
            responseParams: internals.describe(route.settings.response && route.settings.response.schema)
        };
    });
};

internals.describe = function (params) {

    if (params == null || typeof params !== 'object') {

        return null;
    }

    var description = Joi.compile(params).describe();
    return internals.getParamsData(description);
};


internals.getParamsData = function (param, name) {

    // Detection of "false" as validation rule
    if (!name && param.type === 'object' && param.children && Object.keys(param.children).length === 0) {

        return {
            isDenied: true
        };
    }

    // Detection of conditional alternatives
    if (param.ref && param.is) {

        return {
            condition: {
                key: param.ref.substr(4), // removes 'ref:'
                value: internals.getParamsData(param.is)
            },
            then: param.then,
            otherwise: param.otherwise
        };
    }

    var type;
    if (param.valids && param.valids.some(Joi.isRef)) {
        type = 'reference';
    }
    else {
        type = param.type;
    }

    var data = {
        name: name,
        description: param.description,
        notes: param.notes,
        tags: param.tags,
        meta: param.meta,
        unit: param.unit,
        type: type,
        allowedValues: type !== 'reference' && param.valids ? internals.getExistsValues(param.valids) : null,
        disallowedValues: type !== 'reference' && param.invalids ? internals.getExistsValues(param.invalids) : null,
        examples: param.examples,
        peers: param.dependencies && param.dependencies.map(internals.formatPeers),
        target: type === 'reference' ? internals.getExistsValues(param.valids) : null,
        flags: param.flags && {
            allowUnknown: 'allowUnknown' in param.flags && param.flags.allowUnknown.toString(),
            default: param.flags.default,
            encoding: param.flags.encoding, // binary specific
            insensitive: param.flags.insensitive, // string specific
            required: param.flags.presence === 'required'
        }
    };

    if (data.type === 'object') {
        if (param.children) {
            var childrenKeys = Object.keys(param.children);
            data.children = childrenKeys.map(function (key) {

                return internals.getParamsData(param.children[key], key);
            });
        }

        if (param.patterns) {
            data.patterns = param.patterns.map(function (pattern) {

                return internals.getParamsData(pattern.rule, pattern.regex);
            });
        }
    }

    if (data.type === 'alternatives') {
        data.alternatives = param.alternatives.map(function (alternative) {

            return internals.getParamsData(alternative);
        });
    }
    else  {
        data.rules = {};
        if (param.rules) {
            param.rules.forEach(function (rule) {

                data.rules[internals.capitalize(rule.name)] = internals.processRuleArgument(rule);
            });
        }

        ['includes', 'excludes'].forEach(function (rule) {

            if (param[rule]) {
                data.rules[internals.capitalize(rule)] = param[rule].map(function (type) {

                    return internals.getParamsData(type);
                });
            }
        });
    }

    return data;
};


internals.getExistsValues = function (exists) {

    var values = exists.filter(function (value) {

        if (typeof value === 'string' && value.length === 0) {
            return false;
        }

        return true;
    }).map(function (value) {

        if (Joi.isRef(value)) {

            return (value.isContext ? '$' : '') + value.key;
        }

        return value;
    });

    return values.length ? values : null;
};


internals.capitalize = function (string) {

    return string.charAt(0).toUpperCase() + string.slice(1);
};


internals.formatPeers = function (condition) {

    if (condition.key) {

        return 'Requires ' + condition.peers.join(', ') + ' to ' + (condition.type === 'with' ? '' : 'not ') +
            'be present when ' + condition.key + ' is.';
    }

    return 'Requires ' + condition.peers.join(' ' + condition.type + ' ') + '.';
};


internals.formatReference = function (ref) {

    return (ref.isContext ? '$' : '') + ref.key;
};


internals.processRuleArgument = function (rule) {

    var arg = rule.arg;
    if (rule.name === 'assert') {

        return {
            key: internals.formatReference(arg.ref),
            value: internals.describe(arg.cast)
        };
    }
    else if (Joi.isRef(arg)) {
        return {
            ref: internals.formatReference(arg)
        };
    }

    return arg;
};
