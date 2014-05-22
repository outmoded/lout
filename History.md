# Version 4.1.0
- Support Joi 4.3

# Version 4.0.0
- Fix #67: support Hapi 5.x

# Version 3.1.3
- Fix #64: a regression was introduced in 3.1.1 on arrays' rules
- Fix example in the readme

# Version 3.1.2
- Fix #62: fix unnecessary containers around the navbar list
- Fix #63: make css path relative

# Version 3.1.1
- Fix #60: correctly describe POJOs in arrays

# Version 3.1.0
- Fix and support more array constraints

# Version 3.0.0
- Only support hapi 4.x and up

# Version 2.2.0
- Upgrade test suite to Lab 3.x and reach 100% coverage
- Add support for Joi.alternatives()

# Version 2.1.1
- Mark as compatible with Hapi 3.x

# Version 2.1.0
- Fix #47: setting custom basePath makes lout not finding its helpers folder
- Fix #48: add simple way to provide custom CSS

# Version 2.0.1
- Fix #41: css route didn't handle authentication properly
- Fix #43: '/' as endpoint didn't work

# Version 2.0.0
- Support for Hapi 2.x.x
- Beginning of a makeover to have a cleaner default look
- Support for array type in the validation rules

# Version 1.1.1
- Fixes a crash on empty objects

# Version 1.1.0
- Show path parameters
- Upgrade to twitter bootstrap 3.x
- Fix Handlebars dependency

# Version 1.0.1
- Because lout can be installed on a hapi 1.x, check for joi version to alert on incompatibility

# Version 1.0.0

- Support for joi 2.x
- Drop support for joi 1.x (evolution to 2.x is considered easy enough)
- Changes in rendering to account for possible joi objects as the validation root
