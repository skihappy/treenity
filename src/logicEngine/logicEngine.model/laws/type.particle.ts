import { particleClass } from '../particle.class'
import type { logicEngine } from '../types'
import { Union, v, vClass } from '../../types'
import { collectionRef } from '../types'
import type { particleClassLaw } from '../particle.class'

export const typeLaw: particleClassLaw = {
  name: 'types',

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
