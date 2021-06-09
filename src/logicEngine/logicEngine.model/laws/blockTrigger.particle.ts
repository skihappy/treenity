import { particleClass, particleClassLaw } from '../particle.class'
import type { logicEngine, collectionRef } from '../types/types'
import { booleanType, Func, Dict, functionType, Shape, Union, v } from '../../types'
import { collectionRef as vCollectionRef } from '../types/types'
import { typechecked } from '../../utils'

const triggerParticleLaw: particleClassLaw = {
  className: 'blockTriggers',
  compositionSpecType: Shape({
    propTypes: {
      trigger: functionType,
      pins: Dict({
        propType: vCollectionRef({
          collectionName: 'serializableTypes',
        }),
      }),
    },
  }),
}
export const blockTriggerParticleClass = (logicEngine: logicEngine) => {
  return class extends particleClass(logicEngine, triggerParticleLaw) {
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
