'use strict';

const Path = require('path');

const Boom = require('@hapi/boom');
const Hoek = require('@hapi/hoek');
const Handlebars = require('handlebars');
const Joi = require('@hapi/joi');


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


exports.plugin = {
    name: 'lout',
    pkg: require('../package.json'),
    multiple: true,
    requirements: {
        hapi: '>=17.0.0'
    },

    register: function (server, options) {

        const validateOptions = internals.options.validate(options);
        if (validateOptions.error) {
            throw validateOptions.error;
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

        server.dependency(['inert', 'vision'], () => {

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
                options: internals.docs(settings, server)
            });

            if (settings.cssPath) {
                server.route({
                    method: 'GET',
                    path: `${cssBaseUrl}/{path*}`,
                    options: {
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
        });
    }
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
        handler(request, h) {

            let routing = server.table();

            routing = routing.filter((item) => {

                if (request.query.path && item.path !== request.query.path) {

                    return false;
                }

                return !item.settings.isInternal &&
                    item.settings.plugins.lout !== false &&
                    item.method !== 'options' &&
                    (!settings.filterRoutes || settings.filterRoutes({
                        method: item.method,
                        path: item.path,
                        settings: item.settings
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

            if (!routing.length) {
                throw Boom.notFound();
            }

            if (request.query.path) {
                return h.view(settings.routeTemplate, internals.getRoutesData(routing, server));
            }

            return h.view(settings.indexTemplate, internals.getRoutesData(routing, server));
        },
        plugins: {
            lout: false
        }
    };
};


internals.getRoutesData = function (routes, server) {

    return routes.map((route) => ({
        path: route.path,
        method: route.method.toUpperCase(),
        description: route.settings.description,
        notes: internals.processNotes(route.settings.notes),
        tags: route.settings.tags,
        auth: internals.processAuth(route, server),
        vhost: route.settings.vhost,
        cors: route.settings.cors,
        jsonp: route.settings.jsonp,
        pathParams: internals.describe(route.settings.validate.params),
        queryParams: internals.describe(route.settings.validate.query),
        payloadParams: internals.describe(route.settings.validate.payload),
        headersParams: internals.describe(route.settings.validate.headers),
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
    if (param.is &&
        param.ref) {

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
            default: Hoek.reach(param.flags.default, 'description', { default: param.flags.default }),  // Attempt to reach `description` for joi 11
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
        if (param.rules) {
            data.rules = param.rules.map((rule) => ({
                name: internals.capitalize(rule.name),
                params: internals.processRuleArgument(rule)
            }));
        }
        else {
            data.rules = [];
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
    else if (rule.name === 'regex' &&
        arg.pattern) {

        let pattern = arg.pattern;

        if (arg.name) {
            pattern += ` (${arg.name})`;
        }

        if (arg.invert) {
            pattern += ' - inverted';
        }

        return pattern;
    }
    else if (internals.isRef(arg)) {
        return {
            ref: internals.formatReference(arg)
        };
    }

    return arg || JSON.stringify(arg);
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


internals.processAuth = function (route, server) {

    const auth = server.auth.lookup(route);

    return auth;
};
