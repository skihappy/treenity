import { isOptionalType, IAnyModelType, IAnyType, Instance, types as t } from 'mobx-state-tree'
import { MLogicEngine } from './index'
import type { pinDef } from './tsTypes'
import { VTypeClasses, mapShape } from '../utils'
import { v, V } from './vTypes'

const MPin = (vType) => {
  const mstType = vType.nstType

  return t
    .model('pin', {
      side: t.literal('out'),
      value: isOptionalType(mstType) ? mstType : t.maybe(mstType),
      status: t.optional(t.union(t.string, t.array(t.string)), ''),
    })
    .actions((self) => {
      return {
        set: (value: any) => {
          self.value = vType
            .onError((e) => {
              self.status = e.message
            })
            .create(value)
        },
      }
    })
}

export const MInputPin = (vType) =>
  MPin(vType).actions((self) => {
    return {
      afterCreate: () => {
        self.status = vType.mstType.is(self.value) ? '' : 'not initialized'
      },
    }
  })

export const MOutputPin = (vType) =>
  MPin(vType).actions((self) => {
    return {
      afterCreate: () => {
        self.status = 'not initialized'
      },
    }
  })

export const MBaseBlock = (logicEngine, baseBlockDef: any) => {
  const { inputPinDefs, outputPinDefs } = baseBlockDef

  return t.model('baseBlock', {
    inputPins: inputPinDefs.MPins,
    outputPins: outputPinDefs.MPins,
  })
}
