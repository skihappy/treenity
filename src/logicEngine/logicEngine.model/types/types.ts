import { Shape, stringType, Union, objectType, createVComponent } from '../../types'
import { logicEngineModel } from '../index'
import { Instance } from 'mobx-state-tree'
import { assert } from '../../utils'

export type logicEngine = Instance<typeof logicEngineModel>

//reference to a particle flavor inside particle group collection.
//Note, group name is specified by a particle type, normally used as a placeholder
// in a compositionType of group law. Then, refs to other particles in particle compositions are written
//implicitly.
export interface flavor {
  flavorName: flavorTransformPath
  props?: object
}

// transform path, dot notation, last part is target group name, first is source particle flavor, rest is group names of the path
export type flavorTransformPath = string

export interface componentRef extends flavor {
  particleName?: string
}

export type elementRef = flavorTransformPath //transform path, dot notation

export type particleRef = componentRef | elementRef

export const vFlavorTransformPath = stringType.refined((flavorPath: string) => {
  const [sourceParticleName, ...groupPath] = flavorPath.split('.')
  const [targetGroup] = groupPath.reverse()
  assert(!!sourceParticleName && !!targetGroup, 'must be formatted as particleName[.group]')
})

export const vParticleRef = Shape<componentRef>({
  propTypes: {
    particleName: stringType.defaultsTo(''),
    flavorName: vFlavorTransformPath,
    props: objectType.defaultsTo({}),
  },
}).setCasts([
  {
    name: 'elementRef',
    fromType: vFlavorTransformPath,
    cast: (flavorName: string) => ({ particleName: flavorName, flavorName }),
  },
])

export const vFlavor = Shape<flavor>({
  propTypes: {
    flavorName: vFlavorTransformPath,
    props: objectType.defaultsTo({}),
  },
}).setCasts([
  {
    name: 'elementRef',
    fromType: vFlavorTransformPath,
    cast: (flavorName: string) => ({ flavorName }),
  },
])

export interface particleComposition extends componentRef {
  [key: string]: any
}

export const vParticleComposition = Shape<particleComposition>({
  propTypes: vParticleRef.flavor.props.propTypes,
  isStrict: false,
})

const vParticleUnion = Union<componentRef | particleComposition>({
  types: [vParticleRef, vParticleComposition],
})

export interface particleFlavorProps {
  group: string //target group,  not path
}

export const vParticle = createVComponent<componentRef | particleComposition, particleFlavorProps>({
  assert: ({ props: { group: targetGroup } }) => (value) => {
    vParticleUnion.assert(value)
    const { flavorName: transformPath, particleName } = value
    const [particleGroup] = transformPath.split('.').reverse()
    assert(
      targetGroup === particleGroup,
      `particle name=${particleName} flavor=${transformPath} must be of group ${targetGroup}`
    )
  },
  flavor: 'particle',
  create: () => (value) => vParticleUnion.create(value),
})
