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
  maybeFlavorProps,
  optionalFlavorProps,
  funcFlavorProps,
} from '../types'
import { v, vClass, array, Shape, Dict, functionType, Refine, stringType } from '../types'
import {mapShape, assert, reduceShape, toArray, LogicError, once} from '../utils'
import type { logicEngine, particleComposition, flavor } from './types/particle.types'
import {
  compositionConstraint,
  levelDecomposition,
  levelDecompositionFunc,
  particleClassLaw, particleCompositionType,
  vParticleClassLaw
} from './types/law.types'
import { pinAddress } from './laws/block.law/blockConnections.law'

export const particleClass = (logicEngine: logicEngine, law: particleClassLaw) => {
  const safeLaw = vParticleClassLaw.create(law)

  const {
    groupName,
    composition: { type, constraints: compositionConstraints, transforms },
  } = safeLaw as particleClassLaw

  const refineComposition = (constraintName: string, constraint: compositionConstraint) => (composition) => {
    try {
      constraint(composition)
    } catch (e) {
      throw new LogicError(constraintName, e)
    }
  }

  const compositionType = Object.entries(compositionConstraints || {}).reduce(
    (refinedType, [constraintName, constraint]) =>
      Refine({
        type: refinedType,
        refine: refineComposition(constraintName, constraint),
      }),
    type
  )

  return class particleClass {
    public flavor: flavor
    public composition: particleComposition
    public groupName: string = groupName

    constructor(composition: particleComposition) {
      const {
        constructor: {
          //@ts-ignore
          compositionType,
          // @ts-ignore
          law: {
            decomposition: { levels },
          },
        },
      } = this

      this.composition = compositionType.create(composition)
      this.flavor = this.composition.flavor

      Object.defineProperties(
        this,
        mapShape(levels, (level, levelName) => ({ get: once(() => level(this.decomposition)) }))
      )
    }

    static law = safeLaw

    static compositionType = compositionType

    protected decomposition(levelName:string): levelDecomposition {
      const {
        flavor,
        composition,
        constructor: {
          // @ts-ignore
          compositionType,
          // @ts-ignore
          law: {
            decomposition: { constraints: decompositionConstraints },
          },
        },
      } = this

      const decompose = (compositionType: particleCompositionType, composition: particleComposition): levelDecomposition => {
        if (v.is(composition)) return composition

        switch (compositionType.flavor.name) {
          case 'particleRef.shape':
            const [transformTargetFlavor,transformTargetGroup]=

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
