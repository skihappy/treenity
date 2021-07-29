/**
 * Particles live inside particle groups, fully defined by particle group law. This module defines
 * how particles are referenced and specified, during group operations like read and insert.
 *
 * There are elementary particles and there are parametrized particles, these are  particle factories, functions generating
 * parametrized elements.
 * Particles are similar to models,types defined at build time. Particles get instantiated into particle elements at run time.
 * The exact form of elements can vary
 * Particles are usually referenced inside particle compositions, when new particles are specified and added to the group
 * Particle references composed of particle flavor names and props in case of parametrized particle flavors.
 * Flavor names can be transform paths thru the graph of particle transforms, as defined in
 * particle group laws. Dot notation is used to define the path.
 * Particles are referenced by their flavor. In other words, flavor completely identifies a particle within logic system
 *
 * @module
 */

import {
  Shape,
  stringType,
  Union,
  objectType,
  createVTypeFactory,
  flavor,
  ArrayType, vClass, Dict, v, functionType
} from '../types'
import { logicEngineModel } from '../logicEngine.model'
import { Instance } from 'mobx-state-tree'

export type logicEngine = Instance<typeof logicEngineModel>

/**
 * Particle transform path, in dotted notation.
 * Transform path is used as particle flavor name
 * @category particle
 */
export type particleTransformPath = string

/**
 * vType asserting particle transform path.
 * a string array, navigating thru particle transforms.
 * Particle group laws specify possible transforms from  other groups, forming a graph of transforms
 * Its possible to have multiple path between end points, so full path must be specified when referencing a particle
 * @remark a dot notation string will be cast into string array
 * @category particle
 */
export const vParticleTransformPath=stringType.setCasts([{
  castName:'stringArray',
  fromType:ArrayType({type:stringType}),
  cast:arr=>arr.join('.')
}])

/**
 * Particle flavor
 * Every particle carries its flavor, as a marker or metadata
 * Flavors can be simple transform paths or contain props for parametrized particles
 * @typeParam flavorProps props of parametrized flavor
 * @category particle
 */
export type particleFlavor<flavorProps extends object = object>=flavor<flavorProps,particleTransformPath>

/**
 * particle flavor vType
 * flavor is particle  identifier. Each particle carries its flavor thru its life cycle
 * will cast elementary flavor into parametrized flavor
 * @param typeName [[types.stringType]]=''  an optional particle name, in addition to flavor name
 * use to identify particles generated by particle factories. Such particles assume the flavor of factory, so an additional
 * classification can be useful
 * @param flavorName [[vParticleTransformPath]] particle flavor name. A dot notation transform path
 * @param props [[types.objectType]]={} props of parametrized particles.must be of type specified by particle spec
 * @category particle
 */
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

/**
 * Particle composition
 * {@link vParticleComposition}
 * @typeParam flavorProps props of parametrized flavor
 * @category particle
 */
export interface particleComposition<flavorProps extends object = object>{
  /**
   * particle flavor
   */
  flavor:flavor<flavorProps>

  /**
   * any additional structure
   */
  [key: string]: any
}

/**
 * Particle composition vType
 * Its a shape marked by particle flavor
 * Composition is full of references to other particles within the logic system
 * Composition is decomposed by gauges into particle properties, when particle is instantiated
 * Instantiated particle is not an element, but it can generate particle elements in various representations
 * @category particle
 */
export const vParticleComposition = Shape({
  propTypes: {
    flavor:vParticleFlavor
  },
  isStrict:false,
})

/**
 * particle
 * [[vParticle]]
 */
export type particle=particleFlavor | particleComposition

/**
 * @ignore
 */
const vUnflavoredParticle=Union({
  types:[vParticleFlavor,vParticleComposition]
})

/**
 * props of particle type factory [[vParticle]]
 */
export interface particleFlavorProps {
  /**
   * whatever specified in this flavor, will be enforced in particle compositions
   */
  flavor:flavor
}

/**
 *Particle vType
 * Its used inside particle composition types, to reference other particles.
 * Each particle group law defines composition type, that types composition itself.
 * A particle can be a reference to registered particle flavor, or a new composition, for a one shot quick hand
 * New custom type is created to give it a distinct flavor. During decomposition, gauges detect particles by examining
 * composition law and tasting the flavors.
 * @remark particle types are of 'particle' flavor
 * @category particle
 */
export const vParticle=createVTypeFactory<particle,particleFlavorProps>({
  flavorName:'particle',
  assert:({props:{flavor}})=>
          particle=>vUnflavoredParticle.assert(particle,`bad particle reference of flavor=${flavor}`),
  create:()=>particle=>vUnflavoredParticle.create(particle)
})

/**
 * parametrized particle composition
 * [[vParametrizedParticleComposition]]
 * @category particle
 */
export interface parametrizedParticleComposition {
  props:{
    [propName:string]:particle
  },
  composition:(props:object)=>particleComposition
}

/**
 * Particle spec
 * This is how a particle is specified when adding into a group
 * It can be either a parametrized or simple composition
 * @category particle
 */
export type particleSpec=parametrizedParticleComposition | particleComposition

/**
 * Parametrized particle composition vType factory
 * Particles of a group can be simple compositions or composition factories
 * Parametrized composition takes props and produces particle composition, of its flavor. A distinct
 * typeName can be given to identify particles of same flavorName
 * @param props dict of type particles, defining types of props of the composition factory
 * @param composition function, composition factory
 * @category particle
 */
export const vParametrizedParticleComposition=Shape({
  propTypes:{
    props:Dict({type:vParticle({flavor:'type'})}),
    composition:functionType
  }
})

/**
 * Particle spec
 * Each particle of a group is specified by this particle spec. This is what is used for insert operation, into group.
 * Particles can be [simple compositions](particleComposition) or [parametrized composition](parametrizedParticleComposition),
 * which are functions spitting out composition after given some props. The prop types are defined by [particles](particle) of type group.
 * @category particle
 */
export const vParticleSpec=Union({types:[vParticleComposition,vParametrizedParticleComposition]})