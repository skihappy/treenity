'use strict'
function __export(m) {
  for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p]
}
exports.__esModule = true
var mobx_state_tree_1 = require('mobx-state-tree')
var _ = require('lodash')
__export(require('./funcFactories'))
__export(require('./withError'))
__export(require('./vm'))
__export(require('./mstTypes/funcTypes'))
exports.tRainbowArray = function () {
  var types = []
  for (var _i = 0; _i < arguments.length; _i++) {
    types[_i] = arguments[_i]
  }
  return mobx_state_tree_1.types.refinement(
    mobx_state_tree_1.types.array(mobx_state_tree_1.types.union.apply(mobx_state_tree_1.types, _.uniq(types))),
    function (array) {
      return (array || []).every(function (member, index) {
        return types[index].is(member)
      })
    }
  )
}
function randomId(length) {
  if (length === void 0) {
    length = 12
  }
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var charactersLength = characters.length
  var result = ''
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}
exports.randomId = randomId
exports.assert = function (guard, msg) {
  var e = new Error(msg)
  var sucess = typeof guard === 'boolean' ? guard : guard()
  if (!sucess) throw e
}
exports.modelWithID = function (name, properties) {
  return mobx_state_tree_1.types.compose(
    'MRegistry',
    mobx_state_tree_1.types.model('withId', {
      _id: mobx_state_tree_1.types.optional(mobx_state_tree_1.types.identifier, randomId()),
    }),
    mobx_state_tree_1.types.model('', properties)
  )
}
exports.toArray = function (arg) {
  return Array.isArray(arg) ? arg : [arg]
}
