'use strict';

const Joi = require('@hapi/joi');


const internals = {};


module.exports = {
    method: 'GET',
    path: '/test',
    options: {
        handler: () => 'ok',
        validate: {
            query: Joi.object({
                param1: Joi.string().required()
            })
        }
    }
};
