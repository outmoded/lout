![lout Logo](https://raw.github.com/hapijs/lout/master/images/lout.png)

API documentation generator for [**hapi**](https://github.com/hapijs/hapi)

[![Build Status](https://secure.travis-ci.org/hapijs/lout.png)](http://travis-ci.org/hapijs/lout)
[![Dependencies Status](https://david-dm.org/hapijs/lout.png)](https://david-dm.org/hapijs/lout)
[![DevDependencies Status](https://david-dm.org/hapijs/lout/dev-status.png)](https://david-dm.org/hapijs/lout#info=devDependencies)

Lead Maintainer: [Nicolas Morel](https://github.com/Marsup)

##Description
**lout** is a documentation generator for **hapi** servers, providing a human-readable guide for every endpoint
using the route configuration. The module allows full customization of the output.

##Live demo
You can find a [live demo](http://lout.herokuapp.com/) of lout using the unit tests routes.
The routes are of course fake but you can get a grasp of what lout looks like given various inputs.

##Usage

```javascript
var Hapi = require('hapi');
var server = new Hapi.Server(80);

server.route([{
    your routes...
}]);

server.pack.require('lout', function() {
    server.start();
});

```

### Usage in Hapi 6.x

Hapi 6.x has deprecated pack.require() use pack.register() instead

```javascript
var Hapi = require('hapi');
var server = new Hapi.Server(80);

server.pack.register({ plugin: require('lout') }, function() {
    server.start();
});
```

##Parameters
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

### Ignoring a route in documentation

If you want a route not to appear in lout's documentation, you have to set lout settings for this specific route to false.

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
