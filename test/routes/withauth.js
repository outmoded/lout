var handler = function(request) {

    request.reply('ok');
};

module.exports = [{
    method: 'GET',
    path: '/withauth',
    config: {
        handler: handler,
        auth: 'testStrategy'
    }
}, {
    method: 'GET',
    path: '/withauthasobject',
    config: {
        handler: handler,
        auth: {
            mode: 'try',
            strategy: 'testStrategy',
            payload: 'optional',
            tos: '1.0.0',
            scope: ['test'],
            entity: 'user'
        }
    }
}];
