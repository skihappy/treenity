import { objectType, Shape, stringType } from '../../types'
import { assert } from '../../utils'

export type fundamentalFlavorName = string
export const vFundamentalFlavorName = <fundamentalFlavorName>(
  stringType.refined((name: string) => assert(name.split('.').length === 1))
)

//TODO: use in keyof flavor
export interface fundamentalFlavor {
  flavorName: fundamentalFlavorName
  props?: object
}
export interface fundamentalComponentRef extends fundamentalFlavor {
  particleName?: string
}

export type fundamentalElementRef = fundamentalFlavorName

export type fundamentalParticleRef = fundamentalComponentRef | fundamentalElementRef

export const vFundamentalParticleRef = Shape<fundamentalComponentRef>({
  propTypes: {
    particleName: stringType.defaultsTo(''),
    flavorName: vFundamentalFlavorName,
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
