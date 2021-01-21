"use strict";
exports.__esModule = true;
var script_get_model_1 = require("./script.get.model");
var mobx_state_tree_1 = require("mobx-state-tree");
console.log('hey');
var helloWorld = function (who) {
    var msg = "hello " + who;
    console.log(msg);
    return msg;
};
var helloWorldScript = script_get_model_1["default"]('helloWorld', {
    argDefs: [['name', mobx_state_tree_1.types.string]],
    resultType: mobx_state_tree_1.types.string
}, {
    isTypechecked: true
}).create({
    script: helloWorld.toString()
});
helloWorldScript.run('world');
console.log(mobx_state_tree_1.getSnapshot(helloWorldScript));
