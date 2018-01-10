'use strict';

const handler = (request, h) => {

    return 'ok';
};

module.exports = [{
    method: 'GET',
    path: '/withauth',
    options: {
        handler,
        auth: 'testStrategy'
    }
}, {
    method: 'GET',
    path: '/withauthandcors',
    options: {
        handler,
        auth: 'testStrategy',
        cors: true
    }
}, {
    method: 'GET',
    path: '/withauthasobject',
    options: {
        handler,
        auth: {
            mode: 'try',
            strategy: 'testStrategy',
            payload: 'optional',
            scope: ['test'],
            entity: 'user'
        }
    }
}, {
    method: 'GET',
    path: '/withmultipleaccess',
    options: {
        handler,
        auth: {
            mode: 'try',
            strategy: 'testStrategy',
            payload: 'optional',
            access: [{
                scope: ['!a', '+b', 'c', 'd'],
                entity: 'user'
            }, {
                scope: ['abcd'],
                entity: 'any'
            }]
        }
    }
}, {
    method: 'GET',
    path: '/withimplicitauth',
    options: {
        handler,
        auth: {
            mode: 'required'
        }
    }
}];
