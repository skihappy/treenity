import type {
  jsonComponentProps,
  shapeComponentProps,
  arrayComponentProps,
  tupleComponentProps,
  unionComponentProps,
  lateComponentProps,
  refineComponentProps,
  assertValue,
  maybeComponentProps,
  optionalComponentProps,
  funcComponentProps,
} from '../types'
import { v, vClass, array, Shape, Dict, functionType, Refine, stringType } from '../types'
import { mapShape, assert, reduceShape, toArray } from '../utils'
import type { logicEngine, collectionRefProps } from './types/types'

const vFuncDict = () =>
  Dict({
    propType: functionType(),
  })

type compositionType = vClass<any>
type composition = any
type decompositionType = vClass<any>
type decomposition = any
type particleInstance = InstanceType<ReturnType<typeof particleClass>>
type particle = composition

interface compositionConstraint {
  (composition: composition): void
}

interface compositionConstraints {
  [name: string]: assertValue
}

interface decompositionConstraint {
  (decomposition: decomposition): void
}

interface decompositionConstraints {
  [name: string]: decompositionConstraint
}

interface particleProp {
  (particle): any
}

interface particleProps {
  [name: string]: particleProp
}

interface flavorTransform {
  compositionTransform: (fromFlavoredComposition: any) => any
}

interface flavorTransforms {
  [fromFlavor: string]: flavorTransform
}

interface
export interface particleClassLaw {
  className: string

  fundamentalParticles: fundamentalParticles

  composition:
    | {
        //Composition type, types how a particle of this class is composed from other laws
        type: compositionType

        //additional constraints on composition type, the composition law
        constraints?: compositionConstraints

        flavorTransforms?: flavorTransforms
      }
    | compositionType

  decomposition: {
    //additional refinements on composition type,expressed after decomposition
    constraints?: decompositionConstraints

    //will appear on particle,particle class instance
    particleProps?: particleProps
  }
}

const unconstrainedCompositionCast = {
  cast: (compositionType) => ({ type: compositionType }),
}

const vParticleClassLaw = Shape({
  propTypes: {
    flavor: stringType,

    composition: Shape({
      propTypes: {
        type: v,
        constraints: vFuncDict().defaultsTo({}),
        flavorTransforms: vFuncDict().defaultsTo({}),
      },
    }),

    decomposition: Shape({
      propTypes: {
        constraints: vFuncDict.defaultsTo({}),
        particleProps: vFuncDict.defaultsTo({}),
      },
    }),
  },
})

interface decomposer {
  (compositionType: compositionType, composition: composition): decomposition
}
