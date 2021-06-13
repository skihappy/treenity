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
import type { logicEngine, particleComposition } from '../types'
import { particleClass } from '../particle.class'

const vFuncDict = Dict({
  propType: functionType,
})

export type particleCompositionType = vClass<particleComposition>

//decomposition has same shape as composition. Props morph into different structures, yet different for each coherent phase
export type levelDecomposition = particleComposition

export interface levelDecompositionFunc {
  (level: string): levelDecomposition
}

export type element = InstanceType<ReturnType<typeof particleClass>>

export interface compositionConstraint {
  (composition: particleComposition): void
}

export interface compositionConstraints {
  [name: string]: compositionConstraint
}

export interface decompositionConstraint {
  (levelDecompositionFunc: levelDecompositionFunc): void
}

export interface decompositionConstraints {
  [name: string]: decompositionConstraint
}

export interface particleLevel {
  (levelDecompositionFunc: levelDecompositionFunc): levelDecomposition
}

export interface particleLevels {
  [levelName: string]: particleLevel
}

export interface transform {
  (fromElement: element): particleComposition
}

export interface transforms {
  [fromClassName: string]: transform
}

export interface particleClassLaw {
  groupName: string

  composition: {
    //Composition type, types how a particle of this class is composed from other particles
    type: particleCompositionType

    //additional constraints on composition type, the composition law
    constraints?: compositionConstraints

    transforms?: transforms
  }

  decomposition: {
    //additional refinements on composition type,expressed after decomposition
    constraints?: decompositionConstraints

    //will appear on particle,particle class instance
    levels?: particleLevels
  }
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
        levels: vFuncDict.defaultsTo({}),
      },
    }),
  },
})
