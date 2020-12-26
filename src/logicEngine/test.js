"use strict";
exports.__esModule = true;
var script_getModel_1 = require("./script.getModel");
var mobx_state_tree_1 = require("mobx-state-tree");
console.log('hey');
var helloWorld = function (who) {
    var msg = "hello " + who;
    console.log(msg);
    return msg;
};
var helloWorldScript = script_getModel_1["default"]('helloWorld', [['name', mobx_state_tree_1.types.string]], mobx_state_tree_1.types.number).create({
    script: helloWorld.toString()
});
helloWorldScript.run('world');
