'use strict';

var Handlebars = require('handlebars');

var uniqueId = 0;

module.exports = function (options) {

    var data = Handlebars.createFrame(options.data);
    data.collapseId = uniqueId++;

    var children = options.fn.partials.children(this).trim(),
        content = options.fn(this).trim();
    if (content) {
        data.static = false;

        var header = options.fn.partials.header(this, { data: data }).trim();
        content = header
            + '<div class="collapse" id="type' + data.collapseId + '">'
                + '<dl class="well">'
                    + content
                + '</dl>'
            + '</div>';
    } else {
        data.static = true;
        content = options.fn.partials.header(this, { data: data });
    }

    return new Handlebars.SafeString(content + children);
};
