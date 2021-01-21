import { isType, IAnyModelType, IAnyType, IModelType, SnapshotOrInstance, Instance, types as t } from 'mobx-state-tree'
import { MWithId, tRainbowArray } from './utils'
import getBuiltInTypes from './builtin.types'
import MCast from './cast.model'
import MRegistry from './registry.model'
import { tScriptedFunc, modelWithID } from './utils'

const MLogicEngine = modelWithID('logicEngine', {
  name: t.optional(t.string, ''),
  registries: t
    .model('registries', {
      types: MRegistry.setup(),
    })
    .actions((self) => ({})),
  types: t.optional(tScriptedRegistry, []),
  blockComponents: t.optional(tScriptedRegistry, []),
  casts: t.optional(tScriptedRegistry, []),
}).extend((self) => {
  const scriptTools = {
    fromRegistry: (registryName: string) => (entryName: string) => {
      const fromRegistryByName = (registry) => registry.find(([name, type]) => name === entryName)
      const [name, valueFactory] =
        fromRegistryByName(self[registryName]) || fromRegistryByName(self.builtIn[registryName]) || []

      if (!valueFactory) throw new Error(`${registryName} ${entryName} is not registered with logicEngine ${self.name}`)
      return valueFactory(scriptTools)
    },
    typeNamed(typeName: string) {
      const typeFrom = (registry) => registry.find(([name, type]) => name === typeName)
      const [name, typeFactory] = typeFrom(self.types) || typeFrom(builtInTypes) || []

      if (!typeFactory) throw new Error(`type ${typeName} is not registered with logicEngine ${self.name}`)
      return typeFactory(scriptTools)
    },
    strictTypeNamed(typeName: string) {
      const type = scriptTools.typeNamed(typeName)

      if (isType(type)) return typeFactory()
      throw new Error(`${typeName} not a type`)
    },
  }

  const builtInTypes = getBuiltInTypes(scriptTools)

  return {
    actions: {},
    views: {
      ...scriptTools,
      get builtInTypes() {
        return builtInTypes
      },
    },
  }
})

export default MLogicEngine
export type TLogicEngine = Instance<typeof MLogicEngine>
