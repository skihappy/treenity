import { IAnyType, types as t } from 'mobx-state-tree'
import { IFunc, assert, IValidate, typechecked, IScriptedFunc } from '../index'

interface IFuncFactory {
  (IFunc): IFunc
}

type TFuncSnapshot = string | IFunc

const funcTypeFactory = (vm) => (funcFactory: IFuncFactory): IAnyType =>
  t.custom<TFuncSnapshot, IScriptedFunc>({
    name: 'scriptedFunc',

    toSnapshot(scriptedFunc: IScriptedFunc): string {
      return scriptedFunc.script as string
    },

    fromSnapshot(snapshot: TFuncSnapshot, env?: any): IScriptedFunc {
      const scriptedFunc = (script: string): IScriptedFunc => {
        const func = funcFactory(vm.run(script)) as IScriptedFunc
        func.script = script
        return func
      }

      //we do not support any require in scripts. That would involve examining module object and adding require statements to
      // the script. Maybe, but for now, theres global  object and there are props. Its the props for now.
      //Func is serialized, then extracted to get rid of any side effects
      return scriptedFunc(snapshot === 'string' ? snapshot : `module.exports=${(snapshot as IFunc).toString()}`)
    },

    isTargetType(value): boolean {
      return (
        typeof value === 'function' &&
        typeof (value as IScriptedFunc).script === 'string' &&
        !!(value as IScriptedFunc).script
      )
    },

    getValidationMessage(snapshot: TFuncSnapshot): string {
      const getScriptValidationMessage = (): string => {
        const msg = `not a valid function script`
        try {
          return typeof vm.run(snapshot) === 'function' ? '' : msg
        } catch (e) {
          return `${msg}
              ${e.message}
              `
        }
      }

      const getFuncValidationMessage = (): string => {
        return typeof snapshot === 'function' ? '' : 'not a function'
      }

      return typeof snapshot === 'string' ? getScriptValidationMessage() : getFuncValidationMessage()
    },
  })

/*
Serializes any func without typechecking. Func script must be written as es6 module, exporting func with exports statement.
 */
export const tFunc = (vm) => funcTypeFactory(vm)((f) => f)

export const tTypecheckedFunc = (vm) => (argDefs: IValidate[], resultDef: IValidate) =>
  funcTypeFactory(vm)(typechecked(argDefs, resultDef))
