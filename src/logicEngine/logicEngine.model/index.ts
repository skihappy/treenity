import { isType, IAnyModelType, IAnyType, IModelType, SnapshotOrInstance, Instance, types as t } from 'mobx-state-tree'
import { MWithId, tRainbowArray } from '../utils'
import MCast from '../cast.model'
import MRegistry from '../registry.model'
import type { ISetupProps as IRegistrySetupProps } from '../registry.model'
import { tScriptedFunc, modelWithID } from '../utils'
import MBlock from './blockDef.model/block.model'
import type { IBlockSpec } from './blockDef.model/block.model'

const setupRegistry = (setupProps: IRegistrySetupProps): IAnyModelType => {
  return MRegistry.actions((self) => {
    return {
      afterCreate: () => {
        self.setup(setupProps)
      },
    }
  })
}
const MLogicEngine = modelWithID('logicEngine', {
  name: t.optional(t.string, ''),
  registries: t.model('registries', {
    types: setupRegistry({
      verifyValue: (value) => isType(value),
    }),
  }),
}).extend((self) => {
  return {
    actions: {
      //this is a hook that returns internal state, available to all blocks, kinda like context of this instance of
      //logicEngine. The model can be modified to accomodate for the state model
      state: () => {},
      blockModel: (blockSpec: IBlockSpec) => {
        return MBlock(self)
      },
    },
  }
})

export default MLogicEngine
export type TLogicEngine = Instance<typeof MLogicEngine>
