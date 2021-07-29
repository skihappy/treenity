//particle refers to particle representation in particle compositions.
//They are resolved into particle elements during decomposition

import { Shape, stringType, Union, objectType, createVComponent, flavor, componentFlavor } from '../../types'
import { logicEngineModel } from '../index'
import { Instance } from 'mobx-state-tree'
import { assert } from '../../utils'

export type logicEngine = Instance<typeof logicEngineModel>

//reference to a particle flavor inside particle group collection.
//Note, group name is specified by a particle type, normally used as a placeholder
// in a compositionType of group law. Then, refs to other particles in particle compositions are written
//implicitly.

// transform path, dot notation, last part is target group name, first is source particle flavor, rest is group names of the path
export type particleTransformPath = string
export const vParticleTransformPath = stringType.refined((path: string) => {
  const [fromParticleName, ...groupPath] = path.split('.')
  const [toGroup = 'type'] = groupPath.reverse()
  assert(!!toGroup && !!fromParticleName, `bad particle flavor ${path}`)
})

//every particle has a flavor, a little meta object marking it. It is used in composition structures and instances of particles,
// which a bags of gauge measurements,props, decomposed/condensed out of composition
export type componentParticleFlavor<flavorProps extends object = object> = componentFlavor<
  flavorProps,
  particleTransformPath
>
export const vParticleFlavor = Shape({
  propTypes: {
    typeName: stringType.defaultsTo(''),
    flavorName: vParticleTransformPath,
    props: objectType.defaultsTo({}),
  },
}).setCasts([
  {
    castName: 'elementFlavor',
    fromType: vParticleTransformPath,
    cast: (flavorName: particleTransformPath) => ({ flavorName, props: {} }),
  },
])

export const vGroupFlavorName = stringType.refined((string: string) => {
  assert(string.split('.').length === 1, `bad particle ref ${string}: can not be a dotted path`)
})

export type particleRef<flavorProps extends object = object> = flavor<flavorProps>
export const vParticleRef = Shape<componentFlavor>({
  propTypes: {
    typeName: stringType.defaultsTo(''),
    flavorName: vGroupFlavorName,
    props: objectType.defaultsTo({}),
  },
}).setCasts([
  {
    castName: 'elementRef',
    fromType: vParticleTransformPath,
    cast: (flavorName: string) => ({ flavorName, props: {} }),
  },
])

export interface particleComposition<flavorProps extends object = object>
  extends componentFlavor<flavorProps, particleTransformPath> {
  [key: string]: any
}

export const vParticleComposition = Shape<particleComposition>({
  propTypes: {
    typeName: stringType.defaultsTo(''),
    flavorName: vGroupFlavorName,
    props: objectType.defaultsTo({}),
  },
})

export type particleFlavor<flavorProps extends object = object> = flavor<flavorProps, particleTransformPath>
const vParticleUnion = Union<componentParticleFlavor | particleComposition>({
  types: [vParticleFlavor, vParticleComposition],
})

export interface particleFlavorProps {
  group: string //target group,  not path
}

export type particle = particleRef | particleComposition
export const vParticle = createVComponent<componentParticleFlavor | particleComposition, particleFlavorProps>({
  assert: ({ props: { group: targetGroup } }) => (value) => {
    vParticleUnion.assert(value)
    const { flavorName: transformPath, typeName } = value
    const [particleGroup = 'type'] = transformPath.split('.').reverse()
    assert(targetGroup === particleGroup, `particle flavor=${transformPath} must be of group ${targetGroup}`)
  },
  flavorName: 'particle',
  create: () => (value) => vParticleUnion.create(value),
  casts: {
    elementParticleFlavor: () => ({
      fromType: vParticleTransformPath,
      cast: (transformPath) => ({ flavorName: transformPath, props: {} }),
    }),
  },
})
