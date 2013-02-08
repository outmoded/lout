// Load modules

var Hoek = require('hoek');
var Fs = require('fs');
var Handlebars = require('handlebars');
var NodeUtils = require('util');
var Defaults = require('./defaults');


// Declare internals

var internals = {};


exports = module.exports = internals.Lout = function (config) {

    Hoek.assert(this.constructor === internals.Lout, 'Lout must be instantiated using new');

    var settings = Hoek.applyToDefaults(Defaults, config || {});

    var indexTemplateSource = settings.indexTemplate || Fs.readFileSync(settings.indexTemplatePath, 'utf8');
    var routeTemplateSource = settings.routeTemplate || Fs.readFileSync(settings.routeTemplatePath, 'utf8');

    this._compiledIndexTemplate = Handlebars.compile(indexTemplateSource);
    this._compiledRouteTemplate = Handlebars.compile(routeTemplateSource);
};


internals.Lout.prototype.generateIndexMarkup = function (routes) {

    Hoek.assert(NodeUtils.isArray(routes), 'routes must be an array');

    var templateData = internals.getRoutesData(routes);

    return this._compiledIndexTemplate(templateData);
};


internals.Lout.prototype.generateRoutesMarkup = function (routes) {

    Hoek.assert(NodeUtils.isArray(routes), 'routes must be an array');

    var templateData = internals.getRoutesData(routes);
    templateData.path = routes[0] ? routes[0].path : '/';

    return this._compiledRouteTemplate(templateData);
};


internals.getRoutesData = function (routes) {

    var routesData = [];
    var templateConfig = {};

    for (var i = 0, il = routes.length; i < il; ++i) {
        var routeData = internals.getRouteData(routes[i]);
        if (routeData) {
            routesData.push(routeData);
        }
    }

    templateConfig.routes = routesData;

    return templateConfig;
};


internals.getRouteData = function (route) {

    if (!route) {
        return null;
    }

    route.config = route.config || {};
    route.config.validate = route.config.validate || {};

    return {
        path: route.path,
        method: route.method.toUpperCase(),
        description: route.description,
        notes: route.notes,
        tags: route.tags,
        queryParams: internals.getParamsData(route.config.validate.query),
        payloadParams: internals.getParamsData(route.config.validate.schema),
        responseParams: internals.getParamsData(route.config.response)
    };
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

    if (exists === null ||
        exists === undefined) {

        return [];
    }

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