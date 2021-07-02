"use strict";
exports.__esModule = true;
var vm2_1 = require("vm2");
exports.vm = new vm2_1.NodeVM({
    console: 'inherit',
    sandbox: {},
    require: {
        external: {
            transitive: true,
            modules: ['*']
        },
        root: './never/ever'
    }
});
