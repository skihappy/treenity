import {
  ModelPropertiesDeclaration,
  isType,
  IAnyType,
  IModelType,
  SnapshotOrInstance,
  Instance,
  types as t,
  IAnyModelType,
} from 'mobx-state-tree'
const _ = require('lodash')
import vm from './vm'

export type TFunc = (...args: any[]) => any

export const tRainbowArray = (...types: IAnyType[]) =>
  t.refinement(t.array(t.union(..._.uniq(types))), (array) =>
    (array || []).every((member, index) => types[index].is(member))
  )

export function randomId(length = 12): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

export const MWithId = t.model('withId', {
  _id: t.optional(t.identifier, randomId()),
})

export const assert = (guard: boolean | (() => boolean), msg: string) => {
  const e = new Error(msg)
  const failed = typeof guard === 'boolean' ? guard : guard()
  if (failed) throw e
}

export const tJSON = t.custom<string, any>({
  name: 'JSON',
  toSnapshot(value) {
    return JSON.stringify(value)
  },
  fromSnapshot(snapshot: string, env?: any): any {
    return JSON.parse(snapshot)
  },
  isTargetType(value): boolean {
    return !(typeof value === 'string')
  },
  getValidationMessage(snap: string): string {
    try {
      JSON.parse(snap)
      return ''
    } catch (e) {
      return `${snap}  is not a valid JSON string`
    }
  },
})

export const tScriptedFunc = t.custom<string, TFunc>({
  name: 'scriptedType',
  toSnapshot(func) {
    return func.toString()
  },
  fromSnapshot(snapshot: string, env?: any): TFunc {
    return vm.run(snapshot)
  },
  isTargetType(value): boolean {
    return typeof value === 'function'
  },
  getValidationMessage(snapshot: string): string {
    const msg = `${snapshot}  is not a valid script`
    try {
      return typeof vm.run(snapshot) === 'function' ? '' : msg
    } catch (e) {
      return `${msg}: ${e.message}`
    }
  },
})

export const modelWithID = (name: string, properties: ModelPropertiesDeclaration): IAnyModelType =>
  t.compose('MRegistry', MWithId, t.model('', properties))
