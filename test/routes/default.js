'use strict';

const Joi = require('@hapi/joi');


module.exports = [
    {
        method: 'GET',
        path: '/test',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.string().insensitive().required()
                })
            },
            tags: ['admin', 'api'],
            description: 'Test GET',
            notes: 'test note'
        }
    },
    {
        method: 'GET',
        path: '/another/test',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.string().required()
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/zanother/test',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.string().required()
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/test',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param2: Joi.string().valid('first', 'last').invalid('second'),
                    param3: 'third',
                    param4: 42
                })
            }
        }
    },
    {
        method: 'DELETE',
        path: '/test',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param2: Joi.string().valid('first', 'last')
                })
            }
        }
    },
    {
        method: 'PUT',
        path: '/test',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param2: Joi.string().valid('first', 'last')
                })
            }
        }
    },
    {
        method: 'PATCH',
        path: '/test',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param2: Joi.string().valid('first', 'last'),
                    param3: Joi.number().valid(42)
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/notincluded',
        options: {
            handler: () => 'ok',
            plugins: {
                lout: false
            }
        }
    },
    {
        method: 'GET',
        path: '/nested',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.object({
                        nestedparam1: Joi.string().required(),
                        array: Joi.array()
                    })
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/rootobject',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.string().required()
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/rootarray',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.array().items(
                    Joi.string().required(),
                    Joi.object({ param1: Joi.number() }),
                    Joi.number().forbidden()
                ).min(2).max(5).length(3)
            }
        }
    },
    {
        method: 'GET',
        path: '/complexarray',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.array()
                    .ordered('foo', 'bar')
                    .items(
                        Joi.string().required(),
                        Joi.string().valid('four').forbidden(),
                        Joi.object({ param1: Joi.number() }),
                        Joi.number().forbidden()
                    ).min(2).max(5).length(3)
                    .ordered('bar', 'bar')
                    .items(
                        Joi.number().required()
                    )
            }
        }
    },
    {
        method: 'GET',
        path: '/path/{pparam}/test',
        options: {
            handler: () => 'ok',
            validate: {
                params: Joi.object({
                    pparam: Joi.string().required()
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/emptyobject',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.object()
                })
            }
        }
    }, {
        method: 'GET',
        path: '/alternatives',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.alternatives().try(Joi.number().required(), Joi.string().valid('first', 'last'))
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/only-one-valid',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.string().valid('onlyvalid')
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/multiple-valids',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.string().valid('onlyvalid', 'metoo')
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/single-allow',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.string().allow('alsoallow')
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/multiple-allows',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.number().allow(null, 'alsoallow')
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withnestedalternatives',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.object({
                        param2: Joi.alternatives().try(
                            {
                                param3: Joi.object({
                                    param4: Joi.number().min(0).example(5)
                                }).description('this is cool too')
                            },
                            Joi.number().min(42)
                        )
                    }).description('something really cool'),
                    param2: Joi.array().items(
                        Joi.object({
                            param2: Joi.alternatives().try(
                                {
                                    param3: Joi.object({
                                        param4: Joi.number().example(5)
                                    }).description('this is cool too')
                                },
                                Joi.array().items('foo', 'bar'),
                                Joi.number().min(42).required(),
                                Joi.number().max(42).required()
                            )
                        }).description('all the way down')
                    ).description('something really cool')
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/novalidation',
        options: {
            handler: () => 'ok'
        }
    },
    {
        method: 'GET',
        path: '/withresponse',
        options: {
            handler: () => 'ok',
            response: {
                schema: Joi.object({
                    param1: Joi.string()
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withstatus',
        options: {
            handler: () => 'ok',
            response: {
                schema: Joi.object({
                    param1: Joi.string()
                }),
                status: {
                    204: Joi.object({
                        param2: Joi.string()
                    }),
                    404: Joi.object({
                        error: 'Failure'
                    })
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/withpojoinarray',
        options: {
            handler: () => 'ok',
            validate: {
                query: {
                    param1: Joi.array().items({
                        param2: Joi.string()
                    })
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/withnestedrulesarray',
        options: {
            handler: () => 'ok',
            validate: {
                payload: Joi.object({
                    param1: Joi.array().items(Joi.object({
                        param2: Joi.array().items(Joi.object({
                            param3: Joi.string()
                        })).optional()
                    }))
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withhtmlnote',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.string().notes('<span class="htmltypenote">HTML type note</span>')
                })
            },
            notes: '<span class="htmlroutenote">HTML route note</span>'
        }
    },
    {
        method: 'GET',
        path: '/withnotesarray',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.string().notes([
                        '<span class="htmltypenote">HTML type note</span>',
                        '<span class="htmltypenote">HTML type note</span>'
                    ])
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withexample',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.string().regex(/^\w{1,5}$/).example('abcde')
                })
            }
        }
    },
    {
        method: 'POST',
        path: '/denybody',
        options: {
            handler: () => 'ok',
            validate: {
                payload: false
            }
        }
    },
    {
        method: 'POST',
        path: '/rootemptyobject',
        options: {
            handler: () => 'ok',
            validate: {
                payload: Joi.object()
            }
        }
    },
    {
        method: 'GET',
        path: '/withnestedexamples',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.object({
                        param2: Joi.object({
                            param3: Joi.number().example(5)
                        }).example({
                            param3: 5
                        })
                    }).example({
                        param2: {
                            param3: 5
                        }
                    })
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withmeta',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.string().meta({
                        index: true,
                        unique: true
                    })
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withunit',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.number().unit('ms')
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withdefaultvalue',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.number().default(42),
                    param2: Joi.boolean().default(false)
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withdefaultvaluefn',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.number().default(() => 42, 'default test')
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withbinaryencoding',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.binary().min(42).max(128).length(64).encoding('base64')
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withdate',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.date().min('1-1-1974').max('12-31-2020')
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withpeersconditions',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.object()
                        .and('a', 'b', 'c')
                        .or('a', 'b', 'c')
                        .xor('a', 'b', 'c')
                        .with('a', ['b', 'c'])
                        .without('a', ['b', 'c'])
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withpattern',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.object({
                        a: Joi.string()
                    }).pattern(/\w\d/, Joi.boolean())
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withallowunknown',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.object().unknown(),
                    param2: Joi.object().unknown(false)
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withstringspecifics',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.string()
                        .alphanum()
                        .regex(/\d{3}.*/)
                        .regex(/foo/, { name: 'No foo !', invert: true })
                        .token()
                        .email()
                        .guid()
                        .isoDate()
                        .hostname()
                        .lowercase()
                        .uppercase()
                        .trim(),
                    param2: Joi.string().email()
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withconditionalalternatives',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.alternatives()
                        .when('b', {
                            is: 5,
                            then: Joi.string(),
                            otherwise: Joi.number().required().description('Things and stuff')
                        })
                        .when('a', {
                            is: true,
                            then: Joi.date(),
                            otherwise: Joi.any()
                        }),
                    param2: Joi.alternatives()
                        .when('b', {
                            is: 5,
                            then: Joi.string()
                        })
                        .when('a', {
                            is: true,
                            otherwise: Joi.any()
                        })
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withreferences',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.ref('a.b'),
                    param2: Joi.ref('$x')
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withassert',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.object().assert('d.e', Joi.ref('a.c'), 'equal to a.c'),
                    param2: Joi.object().assert('$x', Joi.ref('b.e'), 'equal to b.e')
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withproperties',
        vhost: 'john.doe',
        options: {
            handler: () => 'ok',
            cors: {
                maxAge: 12345
            },
            jsonp: 'callback'
        }
    },
    {
        method: 'OPTIONS',
        path: '/optionstest',
        handler: () => 'ok'
    },
    {
        method: 'GET',
        path: '/withrulereference',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.date().min(Joi.ref('param2')),
                    param2: Joi.date()
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/withcorstrue',
        vhost: 'john.doe',
        options: {
            handler: () => 'ok',
            cors: true
        }
    },
    {
        method: 'GET',
        path: '/withstrip',
        options: {
            handler: () => 'ok',
            validate: {
                query: Joi.object({
                    param1: Joi.any().strip(),
                    param2: Joi.any()
                })
            }
        }
    },
    {
        method: 'GET',
        path: '/internal',
        options: {
            isInternal: true,
            handler: () => 'ok'
        }
    },
    {
        method: 'GET',
        path: '/headers',
        options: {
            handler: () => 'ok',
            validate: {
                headers: Joi.object({
                    param1: Joi.string().insensitive().required()
                })
            }
        }
    }
];
