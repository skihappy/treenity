import {
  clone,
  isType,
  isModelType,
  IAnyModelType,
  IAnyType,
  IModelType,
  SnapshotOrInstance,
  Instance,
  types as t,
} from 'mobx-state-tree'
import { modelWithID, TFunc, tRainbowArray } from '../utils'
import MCast from '../cast.model'
import registerBlock from './registerBlock'
import type { IBlockSpec } from './registerBlock'
import registry from '../registry.model'
import ScriptedFuncDef from '../scriptedFuncDef.class'

//registries contain both values and components, value factories
const MTypeRegistry = registry(
  new ScriptedFuncDef('typeFactory', [['typeRegistryClone', (arg) => MTypeRegistry.is(arg)]], (result) =>
    isType(result)
  ).MScriptedFunc
).views((self) => {
  return {
    transform([name, typeFactory]) {
      return typeFactory(clone(self))
    },
  }
})

const MBlockRegistry = registry({
  verifyValue: (value) => isModelType(value) || typeof value === 'function',
})

export const logicEngineModel = modelWithID('logicEngine', {
  name: t.optional(t.string, ''),
  registries: t.model('registries', {
    types: MTypeRegistry,
    blocks: MBlockRegistry,
  }),
}).extend((self) => {
  return {
    actions: {
      //this is a hook that returns internal state, available to all blocks, kinda like context of this instance of
      //logicEngine. The model can be modified to accommodate for the state model
      state: () => {},

      // registers block model under unique name.
      // arg is either func or a serialized func. The callback tales a child logicEngine as an arg and must return
      //either a block spec or block model. The block  model should be generated by the child logicEngine, after the new block is
      //registered with it. The intent of the design is declarative style of block registrations. No block is allowed to
      // be registered from within a callback. Rather, a new subdomain is started.
      registerBlock: (
        callback: (childLogicEngine: Instance<typeof MLogicEngine>) => (IBlockSpec | IAnyModelType)[] | string
      ) => {
        self.registries.blocks.add()
      },
    },
  }
})
