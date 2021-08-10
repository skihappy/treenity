/*
 The mysterious measurement is typed here.
 Each gaugeTypes represents a measurement of some type, condensed out of any possible structure. Particle classes
 can specify any number of available gauges, as a part of a class law, along with a scaling operator,  function.
 Each gaugeTypes, so included in the law, will become a prop of any particle of the class, with the value formed as prescribed,
 of the type specified, by LAW.

 All in the name of declarative style. The LAW is a box defining a set of assertions, types, along with helper props, t
 he measurements, or gauges

 As an implementation detail in this  implementation, gauges can specify gaugeTypes transforms, scalar casts from  other gaugeTypes types.
 the cast happens after the victim gaugeTypes performed the measurement. Then, the result is stolen, and hacked in the image of
 the invader, by the casting operator. The gTransforms picked up by a class law become additional props of the particles.
 This is analogous to installing a system of measurements, contained within the parent gaugeTypes.
 */

import {
  arrayFlavorProps,
  ArrayType,
  Dict,
  dictFlavorProps,
  Func,
  jsonFlavorProps,
  lateFlavorProps,
  maybeFlavorProps,
  objectType,
  optionalFlavorProps,
  refineFlavorProps,
  Shape,
  shapeFlavorProps,
  tupleFlavorProps,
  undefinedType,
  Union,
  unionFlavorProps,
  v,
  vClass,
  any as vAny,
  Tuple,
  functionType,
  any,
  literalFlavorProps,
  stringType,
  funcFlavorProps,
} from './types'
import { logicEngineModel } from './logicEngine.model'
import { cloneExtend, mapShape, toArray } from './utils'
import type { particle, particleComposition } from './particle/particle.types'
import { Instance } from 'mobx-state-tree'
import { particleTransform } from './particle/particleTransform'
import { vParticle, vParticleComposition } from './particle/particle.types'

//flavors of elementary gauges, each dealing with a structure of a particular elementary type. These are common to any structure
//A set of these gauges defines the measurement completely
export type flavorNames =
  | 'array'
  | 'shape'
  | 'string'
  | 'number'
  | 'function'
  | 'typeCheckedFunction'
  | 'boolean'
  | 'object'
  | 'tuple'
  | 'dict'
  | 'union'
  | 'refine'
  | 'optional'
  | 'maybe'
  | 'late'
  | 'literal'
  | 'any'

export interface gaugeSpec<gaugeModel = any, gaugeValue = any> {
  gaugeName: string
  gaugeModelType?: particle
  gaugeValueType?: particle
  gaugeModel?: (
    flavorName: flavorNames,
    flavorProps: { [propName: string]: gaugeModel | undefined }
  ) => gaugeModel | undefined
  gaugeValue: (decomposition: any) => any
}

export const vGaugeSpec = Shape({
  propTypes: {
    gaugeName: stringType,
    gaugeModelType: vParticle({ groupName: 'type' }).defaultsTo(any),
    gaugeValueType: vParticle({ groupName: 'type' }).defaultsTo(any),
    gaugeModel: functionType.defaultsTo(() => undefined),
    gaugeValue: functionType,
  },
})

export function gaugeModel<gaugeModel = any>(logicEngine: Instance<logicEngineModel>, gaugeSpec: gaugeSpec) {
  const { gaugeName, gaugeModelType, gaugeModel: gaugeFlavorModel } = vGaugeSpec.create(
    gaugeSpec,
    `bad gaugeSpec ${gaugeSpec}`
  )

  return (groupName: string, compositionType: vClass, errMsg: string | string[]): gaugeModel | undefined => {
    const localErrMsg = [...toArray(errMsg), `gaugeName ${gaugeName}`]

    const decomposeFlavor = (compositionType: vClass): gaugeModel | undefined => {
      switch (compositionType.flavor.flavorName) {
        case 'particle':
          return logicEngine.groups[groupName].partcicleClass[gaugeName]

        case 'tuple': {
          const types = (compositionType.flavor.props as tupleFlavorProps).types
          const flavorProps = cloneExtend(compositionType.flavor.props, {
            types: types.map((tupleType) => decomposeFlavor(tupleType)),
          })
          return gaugeFlavorModel('tuple', flavorProps)
        }

        case 'array': {
          const type = (compositionType.flavor.props as arrayFlavorProps).type
          const flavorProps = cloneExtend(compositionType.flavor.props, { type: decomposeFlavor(type) })
          return gaugeFlavorModel('array', flavorProps)
        }

        case 'shape': {
          const propTypes = (compositionType.flavor.props as shapeFlavorProps).propTypes
          const flavorProps = cloneExtend(compositionType.flavor.props, {
            propTypes: mapShape(propTypes, (propType) => decomposeFlavor(propType)),
          })
          return gaugeFlavorModel('shape', flavorProps)
        }

        case 'dict': {
          const { type = any } = compositionType.flavor.props as dictFlavorProps
          const flavorProps = cloneExtend(compositionType.flavor.props, {
            type: decomposeFlavor(type),
          })
          return gaugeFlavorModel('dict', flavorProps)
        }

        case 'union': {
          const types = (compositionType.flavor.props as unionFlavorProps).types
          const flavorProps = cloneExtend(compositionType.flavor.props, {
            type: types.map((type) => decomposeFlavor(type)),
          })
          return gaugeFlavorModel('union', flavorProps)
        }

        case 'refine': {
          const type = (compositionType.flavor.props as refineFlavorProps).type
          const flavorProps = cloneExtend(compositionType.flavor.props, { type: decomposeFlavor(type) })
          return gaugeFlavorModel('refine', flavorProps)
        }

        case 'optional': {
          const type = (compositionType.flavor.props as optionalFlavorProps).type
          const flavorProps = cloneExtend(compositionType.flavor.props, { type: decomposeFlavor(type) })
          return gaugeFlavorModel('optional', flavorProps)
        }

        case 'maybe': {
          const type = (compositionType.flavor.props as maybeFlavorProps).type
          const flavorProps = cloneExtend(compositionType.flavor.props, { type: decomposeFlavor(type) })
          return gaugeFlavorModel('maybe', flavorProps)
        }

        case 'late': {
          const typeFactory = (compositionType.flavor.props as lateFlavorProps).typeFactory
          const flavorProps = cloneExtend(compositionType.flavor.props, {
            typeFactory: () => decomposeFlavor(typeFactory()),
          })
          return gaugeFlavorModel('late', flavorProps)
        }

        case 'literal': {
          return gaugeFlavorModel('literal', compositionType.flavor.props)
        }

        case 'function': {
          return gaugeFlavorModel('function', {})
        }

        case 'typecheckedFunction': {
          const { args = [], result = any } = compositionType.flavor.props as funcFlavorProps
          const flavorProps = cloneExtend(compositionType.flavor.props, {
            result: decomposeFlavor(result),
            args: args.map((arg) => decomposeFlavor(arg)),
          })
          return gaugeFlavorModel('typecheckedFunction', flavorProps)
        }

        case 'boolean': {
          return gaugeFlavorModel('boolean', {})
        }

        case 'string': {
          return gaugeFlavorModel('string', {})
        }

        case 'number': {
          return gaugeFlavorModel('number', {})
        }

        case 'object': {
          return gaugeFlavorModel('object', {})
        }

        case 'any': {
          return gaugeFlavorModel('any', {})
        }
      }
    }

    return decomposeFlavor(compositionType)
  }
}

export function gaugeValue<gaugeValue = any>(logicEngine: Instance<logicEngineModel>, gaugeSpec: gaugeSpec) {
  const { gaugeName, gaugeValueType, gaugeValue: gaugeFlavorValue } = vGaugeSpec.create(
    gaugeSpec,
    `bad gaugeSpec ${gaugeSpec}`
  )

  return (
    groupName: string,
    compositionType: vClass,
    composition: particleComposition,
    errMsg: string | string[]
  ): gaugeValue | undefined => {
    const localErrMsg = [...toArray(errMsg), `gaugeName ${gaugeName}`]

    const decomposeFlavor = (compositionType: vClass, composition: any) => {
      switch (compositionType.flavor.flavorName) {
        case 'particle':
          return particleTransform(logicEngine)(groupName, composition as particle, [
            ...localErrMsg,
            `particle ${composition}`,
          ])[gaugeName]

        case 'tuple': {
          const types = (compositionType.flavor.props as tupleFlavorProps).types
          const decomposition = types.map((type, index) => decomposeFlavor(type, composition[index]))
          return gaugeFlavorValue(decomposition)
        }

        case 'array': {
          const type = (compositionType.flavor.props as arrayFlavorProps).type
          const decomposition = composition.map((compositionElement) => decomposeFlavor(type, compositionElement))
          return gaugeFlavorValue(decomposition)
        }

        case 'shape': {
          const propTypes = (compositionType.flavor.props as shapeFlavorProps).propTypes
          const decomposition = mapShape(propTypes, (propType, propName) =>
            decomposeFlavor(propType, composition[propName])
          )
          return gaugeFlavorValue(decomposition)
        }

        case 'dict': {
          const { type = any } = compositionType.flavor.props as dictFlavorProps
          const decomposition = mapShape(composition, (compositionProp) => decomposeFlavor(type, compositionProp))
          return gaugeFlavorValue(decomposition)
        }

        case 'union': {
          const types = (compositionType.flavor.props as unionFlavorProps).types
          const type = types.find((type) => type.is(composition)) as vClass
          const decomposition = decomposeFlavor(type, composition)
          return gaugeFlavorValue(decomposition)
        }

        case 'refine': {
          const type = (compositionType.flavor.props as refineFlavorProps).type
          const decomposition = decomposeFlavor(type, composition)
          return gaugeFlavorValue(decomposition)
        }

        case 'optional': {
          const type = (compositionType.flavor.props as optionalFlavorProps).type
          const decomposition = decomposeFlavor(type, composition)
          return gaugeFlavorValue(decomposition)
        }

        case 'maybe': {
          const type = (compositionType.flavor.props as maybeFlavorProps).type
          const decomposition = decomposeFlavor(type, composition)
          return gaugeFlavorValue(decomposition)
        }

        case 'late': {
          const type = (compositionType.flavor.props as lateFlavorProps).typeFactory()
          const decomposition = decomposeFlavor(type, JSON.parse(composition))
          return gaugeFlavorValue(decomposition)
        }

        case 'literal': {
          return gaugeFlavorValue(composition)
        }

        case 'any':
        case 'object':
        case 'number':
        case 'string':
        case 'boolean':
        case 'typecheckedFunction':
        case 'function': {
          return gaugeFlavorValue(composition)
        }
      }
    }

    return decomposeFlavor(compositionType, composition)
  }
}
