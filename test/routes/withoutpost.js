var Joi = require('joi');

var handler = function(request) {

    request.reply('ok');
};

module.exports = {
    method: 'GET',
    path: '/test',
    config: {
        handler: handler,
        validate: {
            query: {
                param1: Joi.string().required()
            }
        }
    }
};
