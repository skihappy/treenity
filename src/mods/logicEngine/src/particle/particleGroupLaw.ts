import { particle, particleState, vParticle, vParticleState } from './particle.types'
import { particleClass } from './particle'
import { Dict, functionType, Shape } from '../types'

export interface particleGroupLaw {
  compositionType: particle
  groupTransforms: {
    [groupName: string]: (any) => any
  }
  partnerTransforms: {
    [partnerName: string]: {
      type: particle
      transform: (any) => any
    }
  }
  state: particleState
  gauges: {
    [gaugeName: string]: (self: particleClass) => (gaugeValue: any) => any
  }
}

export const vParticleGroupLaw = Shape({
  propTypes: {
    compositionType: vParticle({ groupName: 'type' }),
    groupTransforms: Dict({
      type: functionType,
    }).defaultsTo({}),
    partnerTransforms: Dict({
      type: Shape({
        propTypes: {
          type: vParticle({ groupName: 'type' }),
          transform: functionType,
        },
      }),
    }),
    state: vParticleState,
    gauges: Dict({
      type: functionType,
    }),
  },
})
