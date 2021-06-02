import { serializableComponentProps, serializableType, Union, v, vClass } from '../../types'
import { collectionRef } from '../types'
import type { particleClassLaw } from '../particle.class'

export const typeLaw: particleClassLaw = {
  name: 'serializableTypes',

  composition: {
    type: Union({
      types: [
        serializableType,
        collectionRef({
          collectionName: 'serializableTypes',
        }),
      ],
    }),
  },

  decomposition: {
    particleProps: {
      mstType: ({ decomposition }) => (decomposition as vClass<serializableComponentProps>).props.mstType,
    },
  },
}
