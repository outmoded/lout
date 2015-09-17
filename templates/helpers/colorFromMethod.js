'use strict';

module.exports = function (context) {

    switch (context.method) {
        case 'GET':
            return 'label label-primary';
        case 'PUT':
            return 'label label-warning';
        case 'POST':
            return 'label label-success';
        case 'DELETE':
            return 'label label-danger';
        default:
            return 'label label-default';
    }
};
