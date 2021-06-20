import { particleClass, particleClassLaw } from '../../particle.class'
import { Dict, functionType, Shape, stringType } from '../../../types'
import { collectionRef } from '../../types/particle.types'
import { pinsLaw } from './pins.law'
import type { logicEngine } from '../../types/particle.types'

const baseBlockCompositionType = Shape({
  propTypes: {},
})
export const baseBlockLaw: particleClassLaw = {
  flavor: 'baseBlock',
  composition: {
    type: baseBlockCompositionType,
  },

  compositionSpecType: ShabaseBlock.particlepe({
    propTypes: {
      pins: pinsLaw.compositionSpecType.defaultsTo({}),
      trigger: collectionRef({ collectionName: 'blockTriggers' }),
      triggerToInputPinMap: Dict({
        propType: stringType,
      }).defaultsTo({}),
      state: Dict({ propType: collectionRef({ collectionName: 'types' }) }).defaultsTo({}),
      executor: functionType,
    },
    helpers: {
      inputPins: ({ pins }) => Object.entries(pins).filter((pinName, { side }) => side === 'in'),
      outputPins: ({ pins }) => Object.entries(pins).filter((pinName, { side }) => side === 'out'),
    },
  }),
}

export const baseBlockLaw = (logicEngine: logicEngine) =>
  class extends particleClass(logicEngine, baseBlockLaw) {
    get vType() {
      const {
        props: { helpers },
      } = this.law.compositionSpecType
      return Shape({
        propTypes: {
          ...this.def,
          ...helpers,
        },
      })
    }
    get mstModel() {}

    get mstNode() {}
  }
