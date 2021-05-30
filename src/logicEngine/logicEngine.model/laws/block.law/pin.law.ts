import { Literal, Shape, vClass } from '../../../types'
import { collectionRef } from '../../types'
import type { particleClassLaw } from '../../particle.class'

export interface pinSpec {
  side: 'in' | 'out'
  type: collectionRef
}

export const pinLaw = (side: 'input' | 'output'): particleClassLaw => ({
  compositionSpecType: Shape(
    {
      propTypes: {
        type: collectionRef({ collectionName: 'serializableTypes' }),
        side: Literal({ value: side }),
      },
    },
    `${side} pin`
  ),
  className: 'pin',
})
