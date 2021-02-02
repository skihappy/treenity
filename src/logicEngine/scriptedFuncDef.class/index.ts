import { types as t, IAnyType, IAnyModelType } from 'mobx-state-tree'
import { MWithId, tRainbowArray } from '../utils'
import MHRecord from './hRecord.model'
import MScriptedFunc from './scriptedFunc.model'

interface IValidate {
  (value: any): Boolean
}
type TArgType = IValidate | IAnyType
type TArgDef = [TArgType] | [name: string, argType: TArgType]

class ScriptedFuncDef {
  MHRecord: IAnyModelType
  argTypes: TArgType[]
  serializableArgTypes: IAnyType[]
  MScriptedFunc: IAnyModelType

  constructor(public name: string, public argDefs: TArgDef[], resultType: TArgType) {
    this.MHRecord = MHRecord(this)
    // @ts-ignore
    this.argTypes = argDefs.map((argDef, index) => this.argType(index))
    // @ts-ignore
    this.serializableArgTypes = argDefs.map((argDef, index) => this.serializableArgType(index))
    this.MScriptedFunc = MScriptedFunc(this)
  }

  argDef(spec: string | number) {
    if (spec === 'string') {
      return this.argDefs.find((argDef) => {
        if (argDef.length === 2 && argDef[0] === (spec as string)) return true
        return false
      })
    }
    return this.argDefs[spec as number]
  }

  argType(spec: string | number) {
    const argDef = this.argDef(spec)
    if (!argDef) return argDef
    return argDef.length === 1 ? argDef[0] : argDef[1]
  }

  serializableArgType(spec: string | number) {
    const argType = this.argType(spec)
    return typeof argType === 'function' ? t.string : argType
  }
}

export default ScriptedFuncDef
