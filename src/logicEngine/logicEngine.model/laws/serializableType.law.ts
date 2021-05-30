import { particleClass } from '../particle.class'
import type { logicEngine } from '../types'
import { serializableType, vClass, serializableComponentProps } from '../../types'
import type { particleClassLaw } from '../particle.class'
import { typeParticleClass } from './type.particle'

const serializableTypeLaw: particleClassLaw = {
  className: 'serializableTypes',
  compositionSpecType: serializableType,
}

export const serializableTypeParticleClass = (logicEngine: logicEngine) => {
  return class extends typeParticleClass(logicEngine) {
    constructor(public particleName: string, protected specDraft) {
      super(particleName, specDraft)
      this.law = serializableTypeLaw
    }

    // @ts-ignore
    get mstType() {
      return (this.def.props as serializableComponentProps).mstType
    }
  }
}
