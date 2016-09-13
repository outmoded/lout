'use strict';

// Load modules
const Joi = require('joi');
const Boom = require('boom');
const Hoek = require('hoek');
const Path = require('path');
const Handlebars = require('handlebars');


// Declare internals

const internals = {
    defaults: {
        endpoint: '/docs',
        auth: false,
        apiVersion: null,
        basePath: Path.join(__dirname, '..', 'templates'),
        cssPath: Path.join(__dirname, '..', 'public', 'css'),
        helpersPath: Path.join(__dirname, '..', 'templates', 'helpers'),
        partialsPath: Path.join(__dirname, '..', 'templates'),
        indexTemplate: 'index',
        routeTemplate: 'route',
        methodsOrder: ['get', 'head', 'post', 'put', 'patch', 'delete', 'trace', 'options'],
        filterRoutes: null
    },
    options: Joi.object({
        engines: Joi.object(),
        endpoint: Joi.string(),
        apiVersion: Joi.string().allow(null),
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


exports.register = function (plugin, options, pluginNext) {

    const validateOptions = internals.options.validate(options);
    if (validateOptions.error) {
        return pluginNext(validateOptions.error);
    }

    const settings = Hoek.clone(internals.defaults);
    Hoek.merge(settings, options);

    if (settings.endpoint[0] !== '/') {
        settings.endpoint = `/${settings.endpoint}`;
    }

    if (settings.endpoint.length > 1 && settings.endpoint[settings.endpoint.length - 1] === '/') {
        settings.endpoint = settings.endpoint.slice(0, -1);
    }

    const cssBaseUrl = `${settings.endpoint === '/' ? '' : settings.endpoint}/css`;

    plugin.dependency(['inert', 'vision'], (server, serverNext) => {

        server.views({
            engines: settings.engines || {
                html: {
                    module: Handlebars.create()
                }
            },
            path: settings.basePath,
            partialsPath: settings.partialsPath,
            helpersPath: settings.helpersPath,
            runtimeOptions: {
                data: {
                    cssBaseUrl: cssBaseUrl.replace(/(.*?)((\/\w+)?\/css)/, '$2'),
                    apiVersion: settings.apiVersion
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
                path: `${cssBaseUrl}/{path*}`,
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

        serverNext();
    });

    pluginNext();
};


exports.register.attributes = {
    pkg: require('../package.json'),
    multiple: true
};


internals.docs = function (settings, server) {

    return {
        auth: settings.auth,
        validate: {
            query: Joi.object({
                path: Joi.string(),
                server: Joi.string()
            }).unknown()
        },
        handler(request, reply) {

            const routingTable = server.table();
            const connections = [];

            routingTable.forEach((connection) => {

                if (request.query.server && connection.info.uri !== request.query.server) {
                    return;
                }

                connection.table = connection.table.filter((item) => {

                    if (request.query.path && item.path !== request.query.path) {

                        return false;
                    }

                    return !item.settings.isInternal &&
                        item.settings.plugins.lout !== false &&
                        item.method !== 'options' &&
                        (!settings.filterRoutes || settings.filterRoutes({
                            method: item.method,
                            path: item.path,
                            settings: item.settings,
                            connection: connection
                        }));
                }).sort((route1, route2) => {

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

            if (connections.every((connection) => !connection.table.length)) {
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

    connections.forEach((connection) => {

        connection.table = internals.getRoutesData(connection.table);
    });

    return connections;
};


internals.getRoutesData = function (routes) {

    return routes.map((route) => ({
        path: route.path,
        method: route.method.toUpperCase(),
        description: route.settings.description,
        notes: internals.processNotes(route.settings.notes),
        tags: route.settings.tags,
        auth: internals.processAuth(route),
        vhost: route.settings.vhost,
        cors: route.settings.cors,
        jsonp: route.settings.jsonp,
        pathParams: internals.describe(route.settings.validate.params),
        queryParams: internals.describe(route.settings.validate.query),
        payloadParams: internals.describe(route.settings.validate.payload),
        responseParams: internals.describe(route.settings.response.schema),
        statusSchema: internals.describeStatusSchema(route.settings.response.status)
    }));
};

internals.describe = function (params) {

    if (params === null || typeof params !== 'object') {

        return null;
    }

    const description = internals.getParamsData(Joi.compile(params).describe());
    description.root = true;
    return description;
};

internals.describeStatusSchema = function (status) {

    const codes = Object.keys(status || {});
    if (!codes.length) {
        return;
    }

    const result = {};
    codes.forEach((code) => {

        result[code] = internals.describe(status[code]);
    });
    return result;
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
                key: internals.formatReference(param.ref),
                value: internals.getParamsData(param.is, param.is.type)
            },
            then: param.then && internals.getParamsData(param.then, param.then.type),
            otherwise: param.otherwise && internals.getParamsData(param.otherwise, param.otherwise.type)
        };
    }

    let type;
    if (param.valids && param.valids.some(internals.isRef)) {
        type = 'reference';
    }
    else {
        type = param.type;
    }

    const data = {
        name,
        description: param.description,
        notes: internals.processNotes(param.notes),
        tags: param.tags,
        meta: param.meta,
        unit: param.unit,
        type,
        allowedValues: param.valids ? internals.getExistsValues(type, param.valids) : null,
        disallowedValues: param.invalids ? internals.getExistsValues(type, param.invalids) : null,
        examples: param.examples,
        peers: param.dependencies && param.dependencies.map(internals.formatPeers),
        target: type === 'reference' ? internals.getExistsValues(type, param.valids) : null,
        flags: param.flags && {
            allowUnknown: param.flags.allowUnknown,
            default: param.flags.default,
            encoding: param.flags.encoding, // binary specific
            insensitive: param.flags.insensitive, // string specific
            required: param.flags.presence === 'required',
            forbidden: param.flags.presence === 'forbidden',
            stripped: param.flags.strip,
            allowOnly: param.flags.allowOnly
        }
    };

    if (data.type === 'object') {
        let children = [];

        if (param.children) {
            const childrenKeys = Object.keys(param.children);
            children = children.concat(childrenKeys.map((key) => internals.getParamsData(param.children[key], key)));
        }

        if (param.patterns) {
            children = children.concat(param.patterns.map((pattern) => internals.getParamsData(pattern.rule, pattern.regex)));
        }

        data.children = children;
    }

    if (data.type === 'array' && param.items) {

        if (param.orderedItems) {
            data.orderedItems = param.orderedItems.map((item) => internals.getParamsData(item));
        }

        data.items = [];
        data.forbiddenItems = [];
        param.items.forEach((item) => {

            item = internals.getParamsData(item);
            if (item.flags && item.flags.forbidden) {
                data.forbiddenItems.push(item);
            }
            else {
                data.items.push(item);
            }
        });
    }

    if (data.type === 'alternatives') {
        data.alternatives = param.alternatives.map((alternative) => internals.getParamsData(alternative));
    }
    else  {
        data.rules = {};
        if (param.rules) {
            param.rules.forEach((rule) => {

                data.rules[internals.capitalize(rule.name)] = internals.processRuleArgument(rule);
            });
        }

        // If we have only one specific rule then set that to our type for
        // brevity.
        const rules = Object.keys(data.rules);
        if (rules.length === 1 && !data.rules[rules[0]]) {
            data.rules = {};
            data.type = rules[0];
        }
    }

    return data;
};


internals.getExistsValues = function (type, exists) {

    const values = exists.filter((value) => {

        if (typeof value === 'string' && value.length === 0) {
            return false;
        }

        if (type === 'number' && Math.abs(value) === Infinity) {
            return false;
        }

        return true;
    }).map((value) => {

        if (internals.isRef(value)) {

            return internals.formatReference(value);
        }

        return JSON.stringify(value);
    });

    return values.length ? values : null;
};


internals.capitalize = function (string) {

    return string.charAt(0).toUpperCase() + string.slice(1);
};


internals.formatPeers = function (condition) {

    if (condition.key) {

        return `Requires ${condition.peers.join(', ')} to ${condition.type === 'with' ? '' : 'not '}be present when ${condition.key} is.`;
    }

    return `Requires ${condition.peers.join(` ${condition.type} `)}.`;
};


internals.isRef = function (ref) {

    return typeof ref === 'string' && /^(ref|context):.+/.test(ref);
};


internals.formatReference = function (ref) {

    if (ref.startsWith('ref:')) {
        return ref.substr(4);
    }

    return '$' + ref.substr(8);
};


internals.processRuleArgument = function (rule) {

    const arg = rule.arg;
    if (rule.name === 'assert') {

        return {
            key: internals.formatReference(arg.ref),
            value: internals.getParamsData(arg.schema)
        };
    }
    else if (internals.isRef(arg)) {
        return {
            ref: internals.formatReference(arg)
        };
    }

    return arg || '';
};

internals.processNotes = function (notes) {

    if (!notes) {
        return;
    }

    if (!Array.isArray(notes)) {
        return [notes];
    }

    return notes;
};

internals.processAuth = function (route) {

    const auth = route.connection.auth.lookup(route);

    /* $lab:coverage:off$ */
    if (auth && (auth.entity || auth.scope)) { // Hapi < 12
        auth.access = [{
            entity: auth.entity,
            scope: {
                selection: auth.scope
            }
        }];
    }
    /* $lab:coverage:on$ */

    return auth;
};
