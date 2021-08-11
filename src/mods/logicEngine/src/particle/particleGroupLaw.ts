import { particle } from './particle.types'
import { particleClass } from './particle'

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
  state: {
    type: particle
    states: {
      [stateName: string]: object | ((self: particleClass) => object)
    }
  }
  gauges: {
    [gaugeName: string]: (self: particleClass) => (gaugeValue: any) => any
  }
}
