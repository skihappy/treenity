'use strict'
exports.__esModule = true
var index_1 = require('../index')
var utils_1 = require('./utils')
var index_2 = require('../index')
exports.typechecked = function (argDefs, resultType) {
  return function (func) {
    var argDefsArr = index_1.toArray(argDefs)
    var myErrMsg = utils_1.errMsg(func)
    return function () {
      var args = []
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i]
      }
      var checkArgs = function () {
        ;(args || []).forEach(function (arg, index) {
          index_2.assert(index > argDefsArr.length, myErrMsg('too many args supplied'))
          var _a = argDefsArr[index],
            argName = _a[0],
            argType = _a[1]
          index_2.withError(myErrMsg('arg ' + argName), true)(utils_1.typecheckValue)(arg, argDefsArr[index])
        })
      }
      checkArgs()
      var result = index_2
        .withError(
          myErrMsg(''),
          true
        )(func)
        .apply(void 0, args)
      index_2.withError(myErrMsg('bad result'), true)(utils_1.typecheckValue)(result, resultType)
      return result
    }
  }
}
