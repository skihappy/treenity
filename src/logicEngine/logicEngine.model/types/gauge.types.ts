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
} from '../../types'
import { logicEngine } from './particle.types'
import { mapShape } from '../../utils'

//flavors of elementary gauges, each dealing with a structure of a particular elementary type. These are common to any structure
//A set of these gauges defines the measurement completely
export type gElementNames =
  | 'array'
  | 'shape'
  | 'union'
  | 'tuple'
  | 'maybe'
  | 'optional'
  | 'refine'
  | 'json'
  | 'literal'
  | 'dict'
  | 'late'

export interface gElement<elementDecomposition, gValue, elementFlavorProps extends object = object> {
  (flavorProps: elementFlavorProps): (elementDecomposition: elementDecomposition) => gValue | undefined
}

export const vGElement = <elementDecomposition, gValue, elementFlavorProps extends object>(
  vElementDecomposition: vClass<elementDecomposition>,
  vParticlePropValue: vClass<gValue>,
  vElementFlavorProps: vClass<gValue>
) =>
  Func<gElement<elementDecomposition, gValue, elementFlavorProps>>({
    args: [vElementFlavorProps],
    result: Func({
      args: [vElementDecomposition],
      result: vParticlePropValue.maybe(),
    }),
  })

export interface gElements<gValue = any> {
  array?: gElement<(gValue | undefined)[], gValue, arrayFlavorProps>
  shape?: gElement<{ [key: string]: gValue | undefined }, gValue, shapeFlavorProps>
  dict?: gElement<{ [key: string]: gValue | undefined }, gValue, dictFlavorProps>
  union?: gElement<gValue | undefined, gValue, unionFlavorProps>
  optional?: gElement<gValue | undefined, gValue, optionalFlavorProps>
  maybe?: gElement<gValue | undefined, gValue, maybeFlavorProps>
  json?: gElement<string, gValue, jsonFlavorProps>
  tuple: gElement<(gValue | undefined)[], gValue, tupleFlavorProps>
  late?: gElement<gValue | undefined, gValue, lateFlavorProps>
  refine?: gElement<gValue | undefined, gValue, refineFlavorProps>
}

export const vGElements = <gValue = any>(vGValue: vClass<gValue>) => {
  const vMaybeGValue = vGValue.maybe()
  type maybeGValue = gValue | undefined

  const vFlavorProps = <flavorProps extends object>(types: { [key: string]: vClass }) =>
    Shape<flavorProps>({
      propTypes: types,
    })

  const undefinedGValue = () => () => undefined
  const identityGValue = () => (gValue: maybeGValue) => gValue

  const elementTypes = mapShape(
    {
      array: [
        ArrayType<maybeGValue[]>({ type: vMaybeGValue }),
        vFlavorProps<arrayFlavorProps>({
          type: v,
        }),
        undefinedGValue,
      ],
      shape: [
        Dict<{ [key: string]: maybeGValue }>({ type: vMaybeGValue }),
        vFlavorProps<shapeFlavorProps>({
          propTypes: Dict<{ propTypes: { [key: string]: vClass } }>({ type: v }),
        }),
        undefinedGValue,
      ],
      dict: [
        Dict<{ [key: string]: maybeGValue }>({ type: vMaybeGValue }),
        vFlavorProps<dictFlavorProps>({
          type: v,
        }),
        undefinedGValue,
      ],
      union: [
        vMaybeGValue,
        vFlavorProps<unionFlavorProps>({
          types: ArrayType({ type: v }),
        }),
        identityGValue,
      ],
      optional: [
        vMaybeGValue,
        vFlavorProps<optionalFlavorProps>({
          type: v,
          defaultValue: v,
        }),
        undefinedGValue,
      ],
      maybe: [
        vMaybeGValue,
        vFlavorProps<maybeFlavorProps>({
          types: ArrayType<vClass[]>({ type: v }),
        }),
        identityGValue,
      ],
      json: [
        vAny,
        vFlavorProps<jsonFlavorProps>({
          type: v,
        }),
        identityGValue,
      ],
      tuple: [
        ArrayType<maybeGValue[]>({ type: vMaybeGValue }),
        vFlavorProps<tupleFlavorProps>({
          types: ArrayType({ type: v }),
        }),
        () => (array: maybeGValue[]) => array,
      ],
      late: [
        vMaybeGValue,
        vFlavorProps<lateFlavorProps>({
          typeFactory: Func<() => vClass>({ args: [], result: v }),
        }),
        identityGValue,
      ],
      refine: [
        vMaybeGValue,
        vFlavorProps<refineFlavorProps>({
          type: v,
          refine: Func({ args: [vAny], result: vAny }),
        }),
        identityGValue,
      ],
    },
    ([vDecomposition, vFlavorProps, defaultValue]) =>
      vGElement(vDecomposition, vGValue.maybe(), vFlavorProps).defaultsTo(defaultValue)
  )

  return Shape<gElements>({ propTypes: elementTypes })
}

export interface gaugeTypes<gValue = any> {
  type?: vClass<gValue>
  elements: gElements<gValue>
}

export const vGauge = <gValue = any>(vGValue: vClass<gValue>) =>
  Shape<gaugeTypes<gValue>>({
    propTypes: {
      type: v.defaultsTo(any),
      elements: vGElements<gValue>(vGValue),
    },
  })
