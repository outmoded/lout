'use strict';

const internals = {};


module.exports = [
    {
        method: 'GET',
        path: '/withauth',
        options: {
            handler: () => 'ok',
            auth: 'testStrategy'
        }
    },
    {
        method: 'GET',
        path: '/withauthandcors',
        options: {
            handler: () => 'ok',
            auth: 'testStrategy',
            cors: true
        }
    },
    {
        method: 'GET',
        path: '/withauthasobject',
        options: {
            handler: () => 'ok',
            auth: {
                mode: 'try',
                strategy: 'testStrategy',
                payload: 'optional',
                scope: ['test'],
                entity: 'user'
            }
        }
    },
    {
        method: 'GET',
        path: '/withmultipleaccess',
        options: {
            handler: () => 'ok',
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
    },
    {
        method: 'GET',
        path: '/withimplicitauth',
        options: {
            handler: () => 'ok'
        }
    }
];
