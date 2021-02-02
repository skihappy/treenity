import { types as t } from 'mobx-state-tree/dist/types'
import { modelWithID, tRainbowArray } from '../utils'
import vm from '../vm'
import { typecheck } from 'mobx-state-tree'
import { tScriptedFunc } from '../utils'
import MHRecord from './hRecord.model'
import ScriptedFuncDef from './index'

const MscriptedFunc = (def: ScriptedFuncDef) =>
  modelWithID(`${def.name}.MFunc`, {
    name: t.optional(t.maybe(t.string), ''),
    defName: def.name,
    func: tScriptedFunc,
    history: t.optional(t.array(MHRecord(def)), []),
  })
    .actions((self) => {
      return {
        runWithHistory: (...args) => {
          // @ts-ignore
          const result = self.run(...args)
          self.history.push({
            result,
            args: args.map((arg, index) => {
              const argName = def.argDefs[index][0]
              return [argName, arg]
            }),
          })
        },
      }
    })
    .views((self) => {
      return {
        run(...args) {
          // @ts-ignore
          typecheck(tRainbowArray(...def.argTypes), args)
          const result = self.func(...args)
          // @ts-ignore
          typecheck(def.resultType, result)
          return result
        },
      }
    })

export default MscriptedFunc
