import { isType, IAnyModelType, IAnyType, IModelType, SnapshotOrInstance, Instance, types as t } from 'mobx-state-tree'
import { MWithId, tRainbowArray } from './utils'
import MCast from './cast.model'
import { TFunc, modelWithID, tScriptedFunc, assert } from './utils'
import { computed, observable } from 'mobx'

export const tScriptedRegistryEntries = t.array(tRainbowArray(t.string, tScriptedFunc))
interface IValueFactoryProps {
  get: (name: string) => any
}
interface IValueFactory {
  (props: IValueFactoryProps): any
}
type TEntry = [string, IValueFactory]
export type TRegistry = TEntry[]
export interface ISetupProps {
  type?: any
  verifyValue?: (any) => boolean
  builtinEntries?: ([string, IValueFactory] | undefined)[]
  isSetup?: boolean
}

const MRegistry = modelWithID('MRegistry', {
  name: t.string,
  scriptedEntries: t.optional(tScriptedRegistryEntries, []),
}).extend((self) => {
  const params: ISetupProps = {}
  const isSetup = {}
  // @ts-ignore
  const registry: TRegistry = computed(() => [...self.scriptedEntries, ...(params.builtinEntries || [])])

  const assertValue = (value) => {
    const { type, verifyValue } = params
    const errorMsg = `value ${value} is not valid in registry ${self.name}`
    !!type && assert(type.is(value), errorMsg)
    // @ts-ignore
    assert(verifyValue(value), errorMsg)
  }

  return {
    views: {
      get(entryName): any {
        const entry = registry.find(([name, value]) => name === entryName)
        assert(!!entry, `entry ${entryName} not in registry ${self.name}`)
        // @ts-ignore
        const [name, valueFactory] = entry
        const value = valueFactory({ get: self.get })
        assertValue(value)
        return value
      },
    },
    actions: {
      setup: (name: string, props: ISetupProps) => {
        assert(!params.isSetup, `can not redefine registry ${self.name}`)
        const {
          isSetup = true,
          type,
          verifyValue = !!type ? (value) => type.is(value) : (value) => true,
          builtinEntries = [],
        } = props
        Object.assign(params, { isSetup, type, verifyValue, builtinEntries: [...builtinEntries] })
      },
      add(name: string, valueFactory: string | IValueFactory): void {
        const entries = typeof valueFactory === 'string' ? self.scriptedEntries : params.builtinEntries
        assert(
          !entries.first(([entryName, valueFactory]) => name === entryName),
          `entry ${name} already exist in registry ${self.name}`
        )
        entries.push([name, valueFactory])
      },
    },
  }
})

export default MRegistry
