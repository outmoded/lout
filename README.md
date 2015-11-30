![lout Logo](https://raw.github.com/hapijs/lout/master/images/lout.png)

API documentation generator for [**hapi**](https://github.com/hapijs/hapi)

[![npm version](https://badge.fury.io/js/lout.svg)](http://badge.fury.io/js/lout)
[![Build Status](https://secure.travis-ci.org/hapijs/lout.svg)](http://travis-ci.org/hapijs/lout)
[![Build status](https://ci.appveyor.com/api/projects/status/05c8hiy96fmn0s37/branch/master?svg=true)](https://ci.appveyor.com/project/hapijs/lout/branch/master)
[![Dependencies Status](https://david-dm.org/hapijs/lout.svg)](https://david-dm.org/hapijs/lout)
[![DevDependencies Status](https://david-dm.org/hapijs/lout/dev-status.svg)](https://david-dm.org/hapijs/lout#info=devDependencies)

Lead Maintainer: [Nicolas Morel](https://github.com/Marsup)

## Description
**lout** is a documentation generator for **hapi** servers, providing a human-readable guide for every endpoint
using the route configuration. The module allows full customization of the output.

## Live demo
You can find a [live demo](http://lout.herokuapp.com/) of lout using the unit tests routes.
The routes are of course fake but you can get a grasp of what lout looks like given various inputs.

## Usage

Lout depends on vision and inert, make sure you register them with hapi.

```javascript
var Hapi = require('hapi');
var server = new Hapi.Server();

server.connection({ port: 80 });

server.register([require('vision'), require('inert'), { register: require('lout') }], function(err) {
});

server.start(function () {
     console.log('Server running at:', server.info.uri);
});
```

## Parameters
The following options are available when registering the plugin:
- _'engines'_ - an object where each key is a file extension (e.g. 'html', 'jade'), mapped to the npm module name (string) used for rendering the templates.  Default is { html: 'handlebars' }.
- _'endpoint'_ - the path where the route will be registered.  Default is /docs.
- _'basePath'_ - the absolute path to the templates folder.  Default is the lout templates folder.
- _'cssPath'_ - the absolute path to the css folder.  Default is the lout css folder. It must contain a style.css.
- _'helpersPath'_ - the absolute path to the helpers folder.  Default is the lout helpers folder. This might need to be null if you change the basePath.
- _'partialsPath'_ - the absolute path to the partials folder.  Default is the lout templates folder. This might need to be null if you change the basePath.
- _'auth'_ - the route configuration for authentication.  Default is to disable auth.
- _'indexTemplate'_ - the name of the template file to contain docs main page.  Default is 'index'.
- _'routeTemplate'_ - the name of the route template file.  Default is 'route'.
- _'filterRoutes'_ - a function that receives a route object containing `method` and `path` and returns a boolean value to exclude routes.
- _'apiVersion'_ - an optional string representing the api version that would be displayed in the documentation.

### Ignoring a route in documentation

If you want a specific route not to appear in lout's documentation, you have to set lout settings for this specific route to false.

Here is an example snippet of a route configuration :

```js
{
  method: 'GET',
  path: '/myroute',
  config: {
    handler: [...],
    [...]
    plugins: {
      lout: false
    }
  }
}

```

If you want to exclude multiple routes using conditions, you can use `filterRoutes` when registering lout :
```js
server.register([require('vision'), require('inert'), {
  register: require('lout'),
  options: {
    filterRoutes: function (route) {
      return route.method !== '*' && !/^\/private\//.test(route.path);
    }
  }
}], function() {
    server.start(function () {
        console.log('Server running at:', server.info.uri);
    });
});
```
