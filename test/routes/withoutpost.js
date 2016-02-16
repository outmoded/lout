'use strict';

const Joi = require('joi');

const handler = (request) => request.reply('ok');

module.exports = {
    method: 'GET',
    path: '/test',
    config: {
        handler,
        validate: {
            query: Joi.object({
                param1: Joi.string().required()
            })
        }
    }
};
