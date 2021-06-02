import { Union, v } from '../../types'
import { collectionRef } from '../types'
import type { particleClassLaw } from '../particle.class'

export const typeLaw: particleClassLaw = {
  flavor: 'types',

  composition: {
    type: Union({
      types: [
        v,
        collectionRef({
          collectionName: 'types',
        }),
      ],
    }),
  },

  decomposition: {
    particleProps: {
      type: ({ decomposition }) => decomposition,
    },
  },
}
