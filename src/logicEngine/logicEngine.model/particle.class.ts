/*
A factory generating a particleClass,  given its law of nature as props. The law types the law of composition of this
particle family. Particle class instantiates laws.old (logic element type) of its class. All the laws.old of that class are stored in the
corresponding collection of logic engine.
Each particle types an element of its kind, similar to a photon type matching bits of light, or a shaksperian
hero matching othello. Then, photons are a part of a lepton family of laws.old.

 */

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
} from '../types'
import { v, vClass, array, Shape, Dict, functionType, Refine, stringType } from '../types'
import { mapShape, assert, reduceShape, toArray } from '../utils'
import type { logicEngine, collectionRefProps } from './types'

const vFuncDict = () =>
  Dict({
    propType: functionType(),
  })

type compositionType = vClass<any>
type composition = any
type decompositionType = vClass<any>
type decomposition = any
type particleInstance = InstanceType<ReturnType<typeof particleClass>>

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

export interface particleClassLaw {
  flavor: string

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

export const particleClass = (logicEngine: logicEngine, law: particleClassLaw) => {
  const safeLaw = vParticleClassLaw.create(law)

  const {
    // @ts-ignore
    composition: { type, constraints: compositionConstraints, flavorTransforms },
  } = safeLaw

  const compositionType = (<any>Object.entries(compositionConstraints).reduce(
    (refinedType, [constraintName, constraint]) =>
      Refine(
        {
          type: refinedType,
          refine: constraint as assertValue,
        },
        constraintName
      ),
    type
  )).cast(/*TODO*/)

  return class particleClass {
    public composition: composition
    public flavor: string

    //specDraft is not type safe spec
    constructor(public particleName: string, composition: composition) {
      const {
        constructor: {
          //@ts-ignore
          compositionType,
          // @ts-ignore
          law: {
            flavor,
            decomposition: { particleProps },
          },
        },
      } = this

      this.composition = compositionType.create(composition)
      this.flavor = flavor
      Object.defineProperties(
        this,
        mapShape(particleProps, (particleProp, name) => ({ get: () => particleProp(this) }))
      )
    }

    static law = safeLaw

    static compositionType = compositionType

    // @ts-ignore
    get decomposition(): decomposition {
      const {
        flavor,
        composition,
        markerMessage,
        constructor: {
          // @ts-ignore
          compositionType,
          // @ts-ignore
          law: {
            decomposition: { constraints: decompositionConstraints },
          },
        },
      } = this

      const decompose = (compositionType: compositionType, composition: composition): decomposition => {
        if (v.is(composition)) return composition

        switch (compositionType.flavor) {
          case 'collectionRef':
            const collectionName = (compositionType.props as collectionRefProps).collectionName
            return logicEngine.collections[collectionName].read(composition, markerMessage).decomposition

          case 'tuple':
            const compositionTupleTypes = (compositionType.props as tupleComponentProps).elementTypes
            return (composition as []).map((compositionTupleElement, index) =>
              decompose(compositionTupleTypes[index], compositionTupleElement)
            )

          case 'array':
            const arrayType = (compositionType.props as arrayComponentProps).elementType
            return (composition as []).map((compositionArrayElement) => decompose(arrayType, compositionArrayElement))

          case 'shape':
            const compositionPropTypes = (compositionType.props as shapeComponentProps).propTypes
            return mapShape(composition, (compositionShapeProp, name) =>
              decompose(compositionPropTypes[name], compositionShapeProp)
            )

          case 'union':
            const compositionUnionTypes = (compositionType.props as unionComponentProps).types
            const unionType = compositionUnionTypes.find((type) => type.is(composition))
            return decompose(unionType as compositionType, composition)

          case 'refine':
            const refineType = (compositionType.props as refineComponentProps).type
            return decompose(refineType, composition)

          case 'optional':
            const optionalType = (compositionType.props as optionalComponentProps).type
            return decompose(optionalType, composition)

          case 'maybe':
            const maybeType = (compositionType.props as maybeComponentProps).type
            return decompose(maybeType, composition)

          case 'late':
            const lateType = (compositionType.props as lateComponentProps).typeFactory()
            return decompose(lateType, composition)

          case 'json':
            const jsonType = (compositionType.props as jsonComponentProps).type
            return decompose(compositionType, JSON.parse(composition as string))
        }

        return composition
      }

      const decomposition = decompose(compositionType, composition)
      mapShape(decompositionConstraints, (constraint, constraintName) => {
        try {
          constraint(this)
          return
        } catch (e) {
          this.assert(false, [constraintName, e.message])
        }
      })
      return decomposition
    }

    protected assert(guard: boolean, message: string | string[] = '') {
      const {
        particleName,
        constructor: {
          // @ts-ignore
          law: { className },
        },
      } = this
      assert(guard, [`particle of: class=${className}, name=${particleName}`, ...toArray(message)])
    }

    protected validate(guard: boolean, message: string = ''): string {
      try {
        assert(guard, message)
        return ''
      } catch (e) {
        return e.message
      }
    }

    // @ts-ignore
    protected get markerMessage(): string {
      return this.validate(false)
    }
  }
}
