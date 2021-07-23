import { IFunc, toArray, IValidate, typechecked } from '../index'
import { typecheckValue, errMsg, validateAny } from './utils'
import { withError } from '../index'

/*
Converts any func into typechecked curried func. All args and result are verified. throws if extra args are supplied.
 */
export const curried = (argDefs: IValidate[], resultType: IValidate) => (func: IFunc): IFunc => {
  const argDefsArr = toArray(argDefs)
  const myErrMsg = errMsg(func)

  const partial = (suppliedArgs: any[]) =>
    typechecked(
      argDefsArr.splice(0, suppliedArgs.length),
      validateAny
    )((...newArgs: any[]) => {
      if (suppliedArgs.length === argDefsArr.length) {
        const result = func(...suppliedArgs.reverse())
        withError(myErrMsg(`bad result`), true)(typecheckValue)(result, resultType)
        return result
      }
      return partial([...suppliedArgs, ...newArgs])
    })

  return partial([])
}
