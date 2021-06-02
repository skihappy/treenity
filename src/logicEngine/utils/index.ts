import { ModelPropertiesDeclaration, IAnyType, types as t, IAnyModelType } from 'mobx-state-tree'
const _ = require('lodash')
export * from './vm'
export * from './mstTypes/funcTypes'
export * from './logicError.class'
export * from './funcFactories'
import { LogicError } from './logicError.class'
export * from './reduceShape'
export * from './mapShape'
export * from './cloneShape'
export * from './deep'
export * from './once'
export * from './deepDefault'
export * from './typeOf'

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

export const assert = (guard: boolean | (() => boolean), msg?: string | string[]) => {
  const errMsg = (() => {
    if (typeof guard === 'boolean') return guard ? '' : msg
    try {
      const isSuccess = guard()
      return isSuccess ? '' : msg
    } catch (e) {
      return [msg, e.message]
    }
  })()

  if (errMsg) throw new LogicError(errMsg)
}

export const validate = (guard: boolean | (() => boolean), msg?: string | string[]): string => {
  try {
    assert(guard, msg)
  } catch (e) {
    return e.message
  }
  return ''
}

export const extendErrMsg = (extendeeMsg: string, extenderMsg: string) =>
  !!extendeeMsg
    ? ''
    : `${extendeeMsg}
${extenderMsg}
`

export const modelWithID = (name: string, properties: ModelPropertiesDeclaration): IAnyModelType =>
  t.compose(
    'MRegistry',
    t.model('withId', {
      _id: t.optional(t.identifier, randomId()),
    }),
    t.model('', properties)
  )

export const toArray = (arg: any[] | any): any[] => {
  return Array.isArray(arg) ? arg : [arg]
}
