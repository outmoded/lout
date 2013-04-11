<a href="https://github.com/spumko"><img src="https://raw.github.com/spumko/spumko/master/images/from.png" align="right" /></a>
![lout Logo](https://raw.github.com/spumko/lout/master/images/lout.png)

API documentation generator for [**hapi**](https://github.com/spumko/hapi)

[![Build Status](https://secure.travis-ci.org/spumko/lout.png)](http://travis-ci.org/spumko/lout)

**lout** is a documentation generator for **hapi** servers, providing a human-readable guide for every endpoint
using the route configuration. The module allows full customization of the output.

**lout** requires that the plugin is granted the _'routes'_ and _'views'_ permissions.

The following options are available when registering the plugin:
- _'endpoint'_ - the path where the route will be registered.  Default is /docs.
- _'basePath'_ - the absolute path to the templates folder.  Default is the lout templates folder.
- _'auth'_ - the route configuration for authentication.  Default is to disable auth.
- _'indexTemplate'_ the name of the template file to contain docs main page.  Default is 'index'.
- _'routeTemplate'_ the name of the route template file.  Default is 'route'.
