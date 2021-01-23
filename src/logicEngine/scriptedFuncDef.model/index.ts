import { types as t } from 'mobx-state-tree'
import { MWithId, tRainbowArray } from '../utils'
import MHRecord from './hRecord.model'
import MScriptedFunc from './scriptedFunc.model'

const MScriptedFuncDef = (logicEngine) =>
  t.compose(
    'scriptedFuncDef',
    MWithId,
    t
      .model('', {
        logicEngine: t.reference(logicEngine.type),
        name: t.maybe(t.string),
        argDefs: t.optional(t.array(tRainbowArray(t.string, t.string)), []),
        resultTypeName: t.optional(t.string, ''),
      })
      .views((self) => {
        return {
          get MHRecord() {
            return MHRecord(self)
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
            return logicEngine.registries.types.get(argDef[1])
          },
          get resultType() {
            return logicEngine.registries.types.get(self.resultTypeName)
          },
          get argTypes() {
            // @ts-ignore
            return self.argDefs.map((argDef, index) => self.argType(index))
          },
          get MScriptedFunc() {
            return MScriptedFunc(self)
          },
        }
      })
  )

export default MScriptedFuncDef
