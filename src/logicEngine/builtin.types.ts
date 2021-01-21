import {
  getType,
  typecheck,
  isType,
  IAnyType,
  IModelType,
  SnapshotOrInstance,
  Instance,
  types as t,
  IAnyModelType,
} from 'mobx-state-tree'
import { boolean } from 'mobx-state-tree/dist/types/primitives'
const _ = require('lodash')
import vm from './vm'
import type { TFunc } from './utils'
import { assert, MWithId, tRainbowArray, tScriptedType, tJSON } from './utils'
import type { TRegistry } from './tsTypes'
import MLogicEngine from './logicEngine.model'
import type { TLogicEngine, IScriptTools } from './logicEngine.model'
import type { TRegister } from './utils'

type TArgDef = [argName: string, typeName: string]

export default (scriptTools: IScriptTools): any[] => {
  //produces custom type that does not serialize but gets verified by custom func. Func is not serializable.
  //If its desired to persist verify func, store it in a scriptedFunc type.
  const tUnserializableOfType = (validate: (tools: IScriptTools) => string) =>
    t.custom<any, any>({
      name: 'tUnserializableOfType',
      fromSnapshot(snapshot: any) {
        return snapshot
      },
      toSnapshot(value: any) {
        return 'unserializable'
      },
      isTargetType(value: any): boolean {
        return false
      },
      getValidationMessage(snapshot: any): string {
        return snapshot === 'unserializable' ? '' : validate(snapshot)
      },
    })

  const getMHRecord = (def) => {
    const MHRecord = t.model(`${def.name}MHRecord`, {
      args: tRainbowArray(
        // @ts-ignore
        ...def.args.map(([argName, typeName], index) => tRainbowArray(argName, def.argType[index]))
      ),
      // @ts-ignore
      result: def.resultType,
    })

    return t.compose(`MHRecord`, MWithId, MHRecord)
  }

  const getMScriptedFuncWithHistory = (def) => {
    const { MHRecord, funcModel, name: defName } = def

    return t.compose(
      `${defName}WithHistory`,
      funcModel,
      t
        .model('funcHistory', {
          history: t.array(MHRecord),
        })
        .actions((self) => {
          return {
            addRecord(argValues, result) {
              self.history.push(
                MHRecord.create({
                  result,
                  args: argValues.map((value, index) => {
                    const argName = def.argDefs[index][0]
                    return [argName, value]
                  }),
                })
              )
            },
          }
        })
    )
  }

  const getMscriptedFunc = (def) => {
    const funcModel = t.compose(
      `scriptedFuncDef:${def.name}.funcModel`,
      MWithId,
      t
        .model('', {
          name: t.maybe(t.string),
          def: t.reference(MScriptedFuncDef),
          script: t.string,
        })
        .actions((self) => {
          return {
            afterCreate() {
              // @ts-ignore
              self.def = def
            },
          }
        })
        .views((self) => {
          const func = vm.run(self.script)

          return {
            run(...args) {
              // @ts-ignore
              typecheck(tRainbowArray(...def.argTypes), args)
              const result = func(...args)
              // @ts-ignore
              typecheck(def.resultType, result)
              return result
            },
            withHistory() {
              return getMScriptedFuncWithHistory(self.def)
            },
          }
        })
    )

    return funcModel
  }

  const MScriptedFuncDef = t.compose(
    'scriptedFuncDef',
    MWithId,
    t
      .model('', {
        name: t.maybe(t.string),
        argDefs: t.optional(t.array(tRainbowArray(t.string, t.string)), []),
        resultTypeName: t.optional(t.string, ''),
      })
      .views((self) => {
        return {
          get MHRecord() {
            return getMHRecord(self)
          },
          argDefByName(name: string) {
            return self.argDefs.find(([argName, typeName]) => argName === name)
          },
          argType(desc: string | number) {
            const argDef =
              typeof desc === 'string'
                ? // @ts-ignore
                  self.argDefByName(desc as string)
                : self.argDefs[desc as number]
            return scriptTools.typeNamed(argDef[1])
          },
          get resultType() {
            return scriptTools.typeNamed(self.resultTypeName)
          },
          get argTypes() {
            // @ts-ignore
            return self.argDefs.map((argDef, index) => self.argType(index))
          },
          get MScriptedFunc() {
            return getMscriptedFunc(self)
          },
        }
      })
  )

  return [
    ['MScriptedFuncDef', () => MScriptedFuncDef],
    ['tUnserializableOfType', () => tUnserializableOfType],
    ['tRainbowArray', () => tRainbowArray],
    ['tJSON', () => tJSON],
    ['tScriptedType', () => tScriptedType],
  ]
}

const registry = [['type1', (params) => {}]]

logicEngine = {
  typeRegistry: reegistry,
  get(name: string) {},
}
