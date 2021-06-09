/*
A factory generating a particleClass,  given its law of nature as props. The law types the law of composition of this
particle family. Particle class instantiates laws.old (logic element type) of its class. All the laws.old of that class are stored in the
corresponding collection of logic engine.
Each particle types an element of its kind, similar to a photon type matching bits of light, or a shaksperian
hero matching othello. Then, photons are a part of a lepton family of laws.old.

 */

import type {
  jsonFlavorProps,
  shapeFlavorProps,
  arrayFlavorProps,
  tupleFlavorProps,
  unionFlavorProps,
  lateFlavorProps,
  refineFlavorProps,
  assertValue,
  maybeFlavorProps,
  optionalFlavorProps,
  funcFlavorProps,
} from '../types'
import { v, vClass, array, Shape, Dict, functionType, Refine, stringType } from '../types'
import { mapShape, assert, reduceShape, toArray, LogicError } from '../utils'
import type { logicEngine, collectionRefProps } from './types/types'

const vFuncDict = Dict({
  propType: functionType,
})

type compositionType = vClass<any>
type composition = any
type stateDecomposition = any
interface decomposition<stateNames extends string> {
  (state: stateNames): stateDecomposition
}
type particleInstance = InstanceType<ReturnType<typeof particleClass>>

interface compositionConstraint {
  (composition: composition): void
}

interface compositionConstraints {
  [name: string]: assertValue
}

interface decompositionConstraint<stateNames extends string> {
  (decomposition: decomposition<stateNames>): void
}

interface decompositionConstraints<stateNames extends string> {
  [name: string]: decompositionConstraint<stateNames>
}

interface states {
  [state: string]: (stateDecomposition: stateDecomposition) => any
}

interface transforms {
  [fromClassName: string]: (fromComposition: composition) => composition
}

export interface particleClassLaw<states extends string> {
  className: string

  composition: {
    //Composition type, types how a particle of this class is composed from other laws
    type: compositionType

    //additional constraints on composition type, the composition law
    constraints?: compositionConstraints

    transforms?: transforms
  }

  decomposition: {
    //additional refinements on composition type,expressed after decomposition
    constraints?: decompositionConstraints<states>

    //will appear on particle,particle class instance
    states?: states
  }
}

const vParticleClassLaw = Shape({
  propTypes: {
    className: stringType,

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
        states: vFuncDict.defaultsTo({}),
      },
    }),
  },
})

export const particleClass = <states extends string>(logicEngine: logicEngine, law: particleClassLaw<states>) => {
  const safeLaw = vParticleClassLaw.create(law)

  const {
    className,
    composition: { type, constraints: compositionConstraints, transforms },
  } = safeLaw as particleClassLaw<states>

  const refineComposition = (constraintName: string, constraint: compositionConstraint) => (composition) => {
    try {
      constraint(composition)
    } catch (e) {
      throw new LogicError(constraintName, e)
    }
  }

  const compositionType = Object.entries(compositionConstraints || {})
    .reduce(
      (refinedType, [constraintName, constraint]) =>
        Refine({
          type: refinedType,
          refine: refineComposition(constraintName, constraint),
        }),
      type
    )
    .cast(
      mapShape(transforms || {}, (transform, fromClassName) => ({
        cast: transform,
        fromType: logicEngine.groups[fromClassName].law.composition.type,
      }))
    )

  return class particleClass {
    public composition: composition
    public className: string = className

    constructor(public flavor: string, composition: composition) {
      const {
        constructor: {
          //@ts-ignore
          compositionType,
          // @ts-ignore
          law: {
            decomposition: { states },
          },
        },
      } = this

      this.composition = compositionType.create(composition)

      Object.defineProperties(
        this,
        mapShape(states, (state, stateName) => ({ get: () => state(this.decomposition(stateName)) }))
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
