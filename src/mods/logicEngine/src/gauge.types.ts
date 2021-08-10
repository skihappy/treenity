/**
 The mysterious measurement is typed here.
 Each gauge decomposes a particle composition into a different structure, of gauge type.
 But thats not the whole story. Gauges can decompose composition type as well. This is useful to translate
 the internal typing system into another one. The [[gaugeSpec.gaugeModel]] will decompose particle compositionType
 into the custom type, e.g.  mst model,  and [[gaugeSpec.gaugeValue]] will decompose particle composition into an instance
 of that type,model
 A particle group law can specify a number of gauges.Each gaugeTypes represents a measurement of some type, condensed out of any possible structure. Particle classes
 can specify any number of available gauges, as a part of a class law, along with a scaling operator,  function.
 Each gaugeTypes, so included in the law, will become a prop of any particle of the class, with the value formed as prescribed,
 of the type specified, by LAW.

 All in the name of declarative style. The LAW is a box defining a set of assertions, types, along with helper props, t
 he measurements, or gauges The gaugeValue of each gauge becomes an instance prop of each
 particle of the group. The gauge model becomes a static prop of particle class of the group

 The gauge model is a one to one mapping between basic types of internal and custom typing systems.  It might limit
 capabilities of a custom system,  but thats how it is.
 */

import {
  arrayFlavorProps,
  dictFlavorProps,
  lateFlavorProps,
  maybeFlavorProps,
  optionalFlavorProps,
  refineFlavorProps,
  Shape,
  shapeFlavorProps,
  tupleFlavorProps,
  unionFlavorProps,
  vClass,
  functionType,
  any,
  stringType,
  funcFlavorProps,
} from './types'
import { logicEngineModel } from './logicEngine.model'
import { cloneExtend, mapShape, toArray } from './utils'
import type { particle, particleComposition } from './particle/particle.types'
import { Instance } from 'mobx-state-tree'
import { particleTransform } from './particle/particleTransform'
import { vParticle } from './particle/particle.types'

/**
 * All possible flavorNames available for gaugeModel mapping
 * see [[types.flavor]]
 */
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

/**
 * Defines a gauge
 */
export interface gaugeSpec<gaugeModel = any, gaugeValue = any> {
  gaugeName: string
  /**
   * makes sense only when internal typing system is mapped to a custom one.
   * it is expressed as particle of type group
   */
  gaugeModelType?: particle
  /**
   * Type of gauge value
   * Expressed as a particle of type group
   */
  gaugeValueType?: particle
  /**
   * A function decomposing particle composition type into a custom type
   * @param flavorName flavor name of one of internal types see [[flavorNames]]
   * @param flavorProps any types are translated into custom typing system
   */
  gaugeModel?: (
    flavorName: flavorNames,
    flavorProps: { [propName: string]: gaugeModel | undefined }
  ) => gaugeModel | undefined
  /**
   * a function decomposing particle composition into a particle prop under [[gaugeName]]
   * @param decomposition
   */
  gaugeValue: (decomposition: any) => any
}

/**
 * gaugeSpec type
 * see [[gaugeSpec]]
 */
export const vGaugeSpec = Shape({
  propTypes: {
    gaugeName: stringType,
    gaugeModelType: vParticle({ groupName: 'type' }).defaultsTo(any),
    gaugeValueType: vParticle({ groupName: 'type' }).defaultsTo(any),
    gaugeModel: functionType.defaultsTo(() => undefined),
    gaugeValue: functionType,
  },
})

/**
 * Implimentation of gauge model
 * maps internal types to any custom typing system
 * @param logicEngine
 * @param gaugeSpec
 * @param gaugeName
 * @param compositionType composition type of group the gauge is applied to
 * @param errMsg an array of additional error message
 */
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

/**
 * gauge value implimentation
 * Decomposes particle composition into gauge value. This is the value of particle instance property under the [[gaugeSpec.gaugeName]]
 * @param logicEngine
 * @param gaugeSpec
 */
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
