"use strict";
exports.__esModule = true;
var mobx_state_tree_1 = require("mobx-state-tree");
var _ = require('lodash');
function randomId(length) {
    if (length === void 0) { length = 12; }
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    var result = '';
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
exports.randomId = randomId;
exports.MWithId = mobx_state_tree_1.types.model('withId', {
    _id: mobx_state_tree_1.types.optional(mobx_state_tree_1.types.identifier, randomId())
});
exports.tUnserializable = mobx_state_tree_1.types.custom({
    name: "unserializable",
    fromSnapshot: function (value) {
        return 'not available';
    },
    toSnapshot: function (value) {
        return 'not available';
    },
    isTargetType: function (value) {
        return typeof value != 'string';
    },
    getValidationMessage: function (value) {
        return '';
    }
});
exports.tRainbowArray = function () {
    var types = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        types[_i] = arguments[_i];
    }
    return mobx_state_tree_1.types.array(mobx_state_tree_1.types.union.apply(mobx_state_tree_1.types, _.uniq(types)));
};
exports.assert = function (guard, msg) {
    var e = new Error(msg);
    var failed = (typeof guard === 'boolean') ? guard : guard();
    if (failed)
        throw e;
};
