import type {
  jsonFlavorProps,
  shapeFlavorProps,
  arrayFlavorProps,
  tupleFlavorProps,
  unionFlavorProps,
  lateFlavorProps,
  refineFlavorProps,
  maybeFlavorProps,
  optionalFlavorProps,
  funcFlavorProps,
} from '../../types'
import { v, vClass, array, Shape, Dict, functionType, Refine, stringType } from '../../types'
import { mapShape, assert, reduceShape, toArray, LogicError } from '../../utils'
import type { logicEngine, particleComposition, particle } from './particle.types'
import { particleClass } from '../particle.class'

const vFuncDict = Dict({
  type: functionType,
})

export type element = InstanceType<ReturnType<typeof particleClass>>

export interface gaugeConstraint {
  (particleElement: element): void
}

export interface gaugeConstraints {
  [name: string]: gaugeConstraint
}

export interface transform {
  (fromElement: element): particleComposition
}

export interface transforms {
  [fromClassName: string]: transform
}

//a scalar transform, from gaugeTypes type to gaugeTypes type
export interface gaugeScalar {
  (gaugeValue: any): any
}

//a particles acquires props scaled by gaugeTypes measure
export interface particleProp {
  gaugeName: string
  scalar: gaugeScalar
}

export interface particleProps {
  [propName: string]: particleProp
}

export interface particleClassLaw {
  groupName: string

  //These are particles that come with the law, for anyone using it, so they dont have to invent them
  //They will live either in serializable scripts, or in hard code as a module. Please,  go an extra mile
  //for the sake of others,  if you are to publish your law. Each fundamental should address a way of composing,as one
  //of types in particleComposition union
  fundamentalParticles: {
    [flavorName: string]: funentalParticle
  }

  //composition transforms from other classes. Basically, a cast at composition level
  transforms?: transforms

  //additional refinements on props, derived from gauges
  constraints?: gaugeConstraints

  //will appear on particle,particle class instance
  props?: particleProps
}

export const vParticleClassLaw = Shape<particleClassLaw>({
  propTypes: {
    groupName: stringType,

    composition: Shape({
      propTypes: {
        type: v,
        constraints: vFuncDict.defaultsTo({}),
        transforms: vFuncDict.defaultsTo({}),
      },
    }),

    decomposition: Shape({
      propTypes: {
        constraints: vFuncDict.defaultsTo({}),
        props: vFuncDict.defaultsTo({}),
      },
    }),
  },
})
