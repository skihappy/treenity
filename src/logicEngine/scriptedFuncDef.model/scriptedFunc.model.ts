import { types as t } from 'mobx-state-tree/dist/types'
import { MWithId, tRainbowArray } from '../utils'
import vm from '../vm'
import { typecheck } from 'mobx-state-tree'
import { tScriptedFunc } from '../utils'
import MHRecord from './hRecord.model'

const MscriptedFunc = (def) => {
  const funcModel = t.compose(
    `scriptedFuncDef:${def.name}.funcModel`,
    MWithId,
    t
      .model('', {
        name: t.maybe(t.string),
        def: t.reference(def.type),
        func: tScriptedFunc,
        history: t.optional(t.array(MHRecord(def)), []),
      })
      .actions((self) => {
        return {
          afterCreate() {
            // @ts-ignore
            self.def = def
          },
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
  )

  return funcModel
}

export default MscriptedFunc
