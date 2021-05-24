import { logicElementClass } from '../logicElement.class'
import type { logicEngine, registryRef } from '../types'
import { booleanType, Func, Dict, functionType, Shape, Union, v } from '../../types'
import { registryRef as vRegistryRef } from '../types'
import { typechecked } from '../../utils'

export const blockTriggerLogicElementClass = (logicEngine: logicEngine) => {
  const registryName = 'blockTriggers'

  const specType = Shape({
    propTypes: {
      trigger: functionType,
      pins: Dict({
        propType: vRegistryRef({
          registryName: 'serializableTypes',
        }),
      }),
    },
  })

  return class extends logicElementClass(logicEngine, registryName, specType) {
    trigger(pinValues: { [pinName: string]: any }): boolean {
      const { trigger, pins: pinTypes } = this.def

      const vPins = Shape({
        propTypes: pinTypes,
      })

      return Func({
        args: [vPins],
        result: booleanType,
      }).create(trigger)(pinValues)
    }
  }
}
