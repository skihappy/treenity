'use strict'
exports.__esModule = true
var mobx_state_tree_1 = require('mobx-state-tree')
var utils_1 = require('../index')
/*
Serializes any func without typechecking. Func script must be written as es6 module, exporting func with exports statement.
 */
exports.tFunc = function (vm) {
  return mobx_state_tree_1.types.custom({
    name: 'scriptedFunc',
    toSnapshot: function (func) {
      //this is not meant to serializa a hardcoded func, but to create a func from a script. By serializing a hardcoded
      //func, some of its closure might be lost and its not gonna work.
      utils_1.assert(!!func.script, 'can not serializa hardcoded funcs. Must be a script.')
      return func.script
    },
    fromSnapshot: function (snapshot, env) {
      var func = vm.run(snapshot)
      func.script = snapshot
      return func
    },
    isTargetType: function (value) {
      return typeof value === 'function'
    },
    getValidationMessage: function (snapshot) {
      var msg = 'not a valid function script'
      try {
        return typeof vm.run(snapshot) === 'function' ? '' : msg
      } catch (e) {
        return e.msg
      }
    },
  })
}
