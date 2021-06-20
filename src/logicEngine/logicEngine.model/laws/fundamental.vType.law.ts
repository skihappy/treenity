import {
  arrayFlavorProps,
  objectType,
  Shape,
  shapeFlavorProps,
  stringType,
  tupleFlavorProps,
  unionFlavorProps,
  vClass,
} from '../../types'
import { assert } from '../../utils'
import { componentRef, flavor, flavorTransformPath, vFlavorTransformPath } from '../types/particle.types'

export type typeFlavorName = string
export const vTypeFlavorName = stringType.refined((name: string) => assert(name.split('.').length === 1))
export interface typeFlavor {
  flavorName: typeFlavorName
  props?: object
}
export interface typeComponentRef extends typeFlavor {
  particleName?: string
}

export type typeElementRef = typeFlavorName

export type typeParticleRef = typeComponentRef | typeElementRef

export const vTypeParticleRef = Shape<typeComponentRef>({
  propTypes: {
    particleName: stringType.defaultsTo(''),
    flavorName: vTypeFlavorName,
    props: objectType.defaultsTo({}),
  },
}).setCasts([
  {
    name: 'typeElementRef',
    fromType: vTypeFlavorName,
    cast: (flavorName: string) => ({ particleName: flavorName, flavorName }),
  },
])

export const vTypeFlavor = Shape<typeFlavor>({
  propTypes: {
    flavorName: vTypeFlavorName,
    props: objectType.defaultsTo({}),
  },
}).setCasts([
  {
    name: 'typeFlavor',
    fromType: vTypeFlavorName,
    cast: (flavorName: string) => ({ flavorName }),
  },
])

export type typeComposition =
  | vClass
  | arrayTypeComposition
  | tupleFlavorProps
  | shapeTypeComposition
  | unionTypeComposition
  | optionalTypeComposition
  | lateTypeComposition
  | jsonTypeComposition
  | maybeTypeComposition
  | dictTypeComposition
  | refineTypeComposition

export type shapeTypeComposition = {
  [key: string]: typeComposition
  // @ts-ignore
  flavor: 'shape'
  // @ts-ignore
  name?: string
}

export type arrayTypeComposition = {
  flavor: 'array'
  name?: string
  type: typeComposition
}

export type tupleTypeComposition = {
  flavor: 'tuple'
  name?: string
  types: typeComposition[]
}

export type unionTypeComposition = {
  flavor: 'union'
  name?: string
  types: typeComposition[]
}

export type optionalTypeComposition = {
  flavor: 'optional'
  name?: string
  type: typeComposition
}

export type maybeTypeComposition = {
  flavor: 'maybe'
  name?: string
  type: typeComposition
}

export type dictTypeComposition = {
  flavor: 'dict'
  name?: string
  type: typeComposition
}

export type lateTypeComposition = {
  flavor: 'late'
  name?: string
  type: typeComposition
}

export type refineTypeComposition = {
  flavor: 'refine'
  name?: string
  type: typeComposition
  refine: (any) => void
}

export type jsonTypeComposition = {
  flavor: 'json'
  name?: string
  type: typeComposition
}

export