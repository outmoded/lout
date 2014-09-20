var t = require('joi');

var handler = function(request) {

    request.reply('ok');
};

module.exports = [{
    method: 'GET',
    path: '/test',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.string().insensitive().required()
            }
        },
        tags: ['admin', 'api'],
        description: 'Test GET',
        notes: 'test note'
    }
}, {
    method: 'GET',
    path: '/another/test',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.string().required()
            }
        }
    }
}, {
    method: 'GET',
    path: '/zanother/test',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.string().required()
            }
        }
    }
}, {
    method: 'POST',
    path: '/test',
    config: {
        handler: handler,
        validate: {
            query: {
                param2: t.string().valid('first', 'last')
            }
        }
    }
}, {
    method: 'DELETE',
    path: '/test',
    config: {
        handler: handler,
        validate: {
            query: {
                param2: t.string().valid('first', 'last')
            }
        }
    }
}, {
    method: 'PUT',
    path: '/test',
    config: {
        handler: handler,
        validate: {
            query: {
                param2: t.string().valid('first', 'last')
            }
        }
    }
}, {
    method: 'HEAD',
    path: '/test',
    config: {
        handler: handler,
        validate: {
            query: {
                param2: t.string().valid('first', 'last'),
                param3: t.number().valid(42)
            }
        }
    }
}, {
    method: 'GET',
    path: '/notincluded',
    config: {
        handler: handler,
        plugins: {
            lout: false
        }
    }
}, {
    method: 'GET',
    path: '/nested',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.object({
                    nestedparam1: t.string().required()
                })
            }
        }
    }
}, {
    method: 'GET',
    path: '/rootobject',
    config: {
        handler: handler,
        validate: {
            query: t.object({
                param1: t.string().required()
            })
        }
    }
}, {
    method: 'GET',
    path: '/rootarray',
    config: {
        handler: handler,
        validate: {
            query: t.array().includes(t.string(), t.object({
                param1: t.number()
            })).excludes(t.number()).min(2).max(5).length(3)
        }
    }
}, {
    method: 'GET',
    path: '/path/{pparam}/test',
    config: {
        handler: handler,
        validate: {
            params: {
                pparam: t.string().required()
            }
        }
    }
}, {
    method: 'GET',
    path: '/emptyobject',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.object()
            }
        }
    }
}, {
    method: 'GET',
    path: '/alternatives',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.alternatives().try(t.number().required(), t.string().valid('first', 'last'))
            }
        }
    }
}, {
    method: 'GET',
    path: '/novalidation',
    config: {
        handler: handler
    }
}, {
    method: 'GET',
    path: '/withresponse',
    config: {
        handler: handler,
        response: {
            schema: {
                param1: t.string()
            }
        }
    }
}, {
    method: 'GET',
    path: '/withpojoinarray',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.array().includes({
                    param2: t.string()
                })
            }
        }
    }
}, {
    method: 'POST',
    path: '/withnestedrulesarray',
    config: {
        handler: handler,
        validate: {
            payload: {
                param1: t.array().includes(t.object({
                    param2: t.array().includes(t.object({
                        param3: t.string()
                    })).optional()
                }))
            }
        }
    }
}, {
    method: 'GET',
    path: '/withhtmlnote',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.string().notes('<span class="htmltypenote">HTML type note</span>')
            }
        },
        notes: '<span class="htmlroutenote">HTML route note</span>'
    }
}, {
    method: 'GET',
    path: '/withexample',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.string().regex(/^\w{1,5}$/).example('abcde')
            }
        }
    }
}, {
    method: 'POST',
    path: '/denybody',
    config: {
        handler: handler,
        validate: {
            payload: false
        }
    }
}, {
    method: 'POST',
    path: '/rootemptyobject',
    config: {
        handler: handler,
        validate: {
            payload: t.object()
        }
    }
}, {
    method: 'GET',
    path: '/withnestedexamples',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.object({
                    param2: t.object({
                        param3: t.number().example(5)
                    }).example({
                        param3: 5
                    })
                }).example({
                    param2: {
                        param3: 5
                    }
                })
            }
        }
    }
}, {
    method: 'GET',
    path: '/withmeta',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.string().meta({
                    index: true,
                    unique: true
                })
            }
        }
    }
}, {
    method: 'GET',
    path: '/withunit',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.number().unit('ms')
            }
        }
    }
}, {
    method: 'GET',
    path: '/withdefaultvalue',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.number().default(42)
            }
        }
    }
}, {
    method: 'GET',
    path: '/withbinaryencoding',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.binary().min(42).max(128).length(64).encoding('base64')
            }
        }
    }
}, {
    method: 'GET',
    path: '/withdate',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.date().min('1-1-1974').max('12-31-2020')
            }
        }
    }
}, {
    method: 'GET',
    path: '/withpeersconditions',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.object()
                    .and('a', 'b', 'c')
                    .or('a', 'b', 'c')
                    .xor('a', 'b', 'c')
                    .with('a', ['b', 'c'])
                    .without('a', ['b', 'c'])
            }
        }
    }
}, {
    method: 'GET',
    path: '/withpattern',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.object({
                    a: t.string()
                }).pattern(/\w\d/, t.boolean())

            }
        }
    }
}, {
    method: 'GET',
    path: '/withallowunknown',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.object().unknown(),
                param2: t.object().unknown(false)
            }
        }
    }
}, {
    method: 'GET',
    path: '/withstringspecifics',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.string()
                    .alphanum()
                    .regex(/\d{3}.*/)
                    .token()
                    .email()
                    .guid()
                    .isoDate()
                    .hostname()
                    .lowercase()
                    .uppercase()
                    .trim()
            }
        }
    }
}, {
    method: 'GET',
    path: '/withconditionalalternatives',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.alternatives()
                    .when('b', {
                        is: 5,
                        then: t.string(),
                        otherwise: t.number()
                    })
                    .when('a', {
                        is: true,
                        then: t.date(),
                        otherwise: t.any()
                    })
            }
        }
    }
}, {
    method: 'GET',
    path: '/withreferences',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.ref('a.b'),
                param2: t.ref('$x')
            }
        }
    }
}, {
    method: 'GET',
    path: '/withassert',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: t.object().assert('d.e', t.ref('a.c'), 'equal to a.c'),
                param2: t.object().assert('$x', t.ref('b.e'), 'equal to b.e')
            }
        }
    }
}, {
    method: 'GET',
    path: '/withproperties',
    vhost: 'john.doe',
    config: {
        handler: handler,
        cors: false,
        jsonp: 'callback'
    }
}];
