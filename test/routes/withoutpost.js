'use strict';

const Joi = require('joi');

const handler = (request, h) => {

    return 'ok';
};

module.exports = {
    method: 'GET',
    path: '/test',
    options: {
        handler,
        validate: {
            query: Joi.object({
                param1: Joi.string().required()
            })
        }
    }
};
