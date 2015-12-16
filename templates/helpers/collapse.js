'use strict';

const Handlebars = require('handlebars');

let uniqueId = 0;

module.exports = function (options) {

    const data = Handlebars.createFrame(options.data);
    data.collapseId = uniqueId++;

    const children = options.fn.partials.children(this).trim();
    let content = options.fn(this).trim();
    if (content) {
        data.static = false;

        const header = options.fn.partials.header(this, { data }).trim();
        content = `${header}
            <div class="collapse" id="type${data.collapseId}">
                <dl class="well">
                    ${content}
                </dl>
            </div>`;
    }
    else {
        data.static = true;
        content = options.fn.partials.header(this, { data });
    }

    return new Handlebars.SafeString(content + children);
};
