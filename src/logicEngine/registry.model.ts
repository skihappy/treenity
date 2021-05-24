import { types as t } from 'mobx-state-tree'
import { assert, toArray } from './utils'
import { vClass, Serializable, Shape, stringType, Union, Refine } from './types'

interface entry {
  name: string
  value: any
}

const tScriptedEntry = t.model('scriptedEntry', {
  name: t.string,
  value: t.string,
})

const vScriptedEntry = Serializable('scriptedEntry', { mstType: tScriptedEntry })

const findIn = (entries: entry[]) => (name): entry | undefined =>
  entries.find(({ name: entryName }: entry) => name === entryName)

const insertIn = (entries: entry[]) => (entry): number => entries.push(entry)

const deleteIn = (entries: entry[]) => (name): boolean => {
  const index = entries.findIndex(({ name: entryName }: entry) => name === entryName)
  if (index < 0) return false
  entries.splice(index, 1)
  return true
}

export const registryModel = (vm) => (vNakedValue: vClass) => {
  const vScriptedValue = Refine('scriptedValue', {
    type: stringType,
    refine: (script) => vNakedValue.assert(vm.run(script)),
  })

  const vEntry = Shape('entry', {
    propTypes: {
      name: stringType,
      value: Union('value', {
        types: [vNakedValue, vScriptedValue],
      }),
    },
    helpers: {
      nakedValue: ({ name, value }) => (vScriptedValue.is(value) ? vm.run(vm.run(value as string)) : value),
    },
  })

  return t
    .model('MRegistry', {
      name: t.string,
      persistentEntries: t.optional(t.array(tScriptedEntry), []),
    })
    .views((self) => ({
      assert(guard: boolean, errMessage?: string | string[]) {
        assert(guard, [`registry ${self.name}`, ...toArray(errMessage)])
      },
    }))
    .actions((self) => {
      const volatileEntries: entry[] = []

      const entries = (which: 'persistent' | 'volatile' | entry): entry[] => {
        return which === ('persistent' || vScriptedEntry.is(which)) ? self.persistentEntries : volatileEntries
      }

      const verify = (func: () => any, errMessage?: string | string[]) => {
        try {
          func()
        } catch (e) {
          self.assert(false, errMessage)
        }
      }

      //implements crud
      return {
        read(name: string): any {
          const entry = findIn(entries('persistent')) || findIn(entries('volatile'))
          self.assert(!!entry, `read: can not find entry ${name}`)
          return vEntry.create(entry).nakedValue
        },

        upsert(entry: entry) {
          verify(() => vEntry.assert(entry), 'upsert:  bad entry')
          const { name, value } = entry
          try {
            this.delete(name)
          } catch (e) {}
          insertIn(entries(entry))(entry)
        },

        update(entry: entry) {
          verify(() => vEntry.assert(entry), 'update:  bad entry')
          const { name, value } = entry
          verify(() => this.delete(name), `update: entry ${name} does not exists`)
          insertIn(entries(entry))
        },

        insert(entry: entry) {
          verify(() => vEntry.assert(entry), 'insert:  bad entry')
          const { name, value } = entry
          verify(() => this.read(name), `insert: entry ${name} already exists`)
          insertIn(entries(entry))
        },

        delete(name: string) {
          self.assert(
            deleteIn(entries('persistent'))(name) || deleteIn(entries('volatile'))(name),
            `delete: entry ${name} does not exist`
          )
        },
      }
    })
}
