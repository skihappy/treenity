'use strict'
var __spreadArrays =
  (this && this.__spreadArrays) ||
  function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) r[k] = a[j]
    return r
  }
exports.__esModule = true
var utils_1 = require('../index')
var utils_2 = require('./utils')
var utils_3 = require('../index')
/*
Converts any func into typechecked curried func. All args and result are verified. throws if extra args are supplied.
 */
exports.curried = function (argDefs, resultType) {
  return function (func) {
    var argDefsArr = utils_1.toArray(argDefs)
    var myErrMsg = utils_2.errMsg(func)
    var partial = function (suppliedArgs) {
      return utils_1.typechecked(
        argDefsArr.splice(0, suppliedArgs.length),
        utils_2.validateAny
      )(function () {
        var newArgs = []
        for (var _i = 0; _i < arguments.length; _i++) {
          newArgs[_i] = arguments[_i]
        }
        if (suppliedArgs.length === argDefsArr.length) {
          var result = func.apply(void 0, suppliedArgs.reverse())
          utils_3.withError(myErrMsg('bad result'), true)(utils_2.typecheckValue)(result, resultType)
          return result
        }
        return partial(__spreadArrays(suppliedArgs, newArgs))
      })
    }
    return partial([])
  }
}
