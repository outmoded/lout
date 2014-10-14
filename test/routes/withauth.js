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
            scope: ['test'],
            entity: 'user'
        }
    }
}];
