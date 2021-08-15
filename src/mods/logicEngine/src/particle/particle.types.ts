/**
 * Particles live inside particle groups as particle specs. A group is fully defined by particle group law. This module defines
 * how particles are referenced and specified, during group operations like read and insert.
 * A particle is instantiated by a read method, taking a particle as parameter.
 * Particles have a lifecycle, from particle spec, to an instantiated particle, to particle elements.
 * An instance of a particle can generate various elements, representations of itself. Particles can be
 * thought of as types generating elements. A particle spec is a description of particle, a composition
 * using other particles, and needs the rest of logic engine to be decomposed into something useful.
 *
 * Heres another way to look at particles. A particle spec describes how a particle is composed of other particles. Then,
 * a particle instance is an object full of properties, that are decomposed out of the particle structure. These decompositions
 * are performed by gauges. Each gauge measures a quality of a particle, by transforming particle composition structure into
 * the structure of that quality. It can be a simple number, or an mst model. The interesting property of gauge functions is
 * they work on any structure. So, they are defined as separate entities, particles, and contained in a group called Gauge.
 * Any gauge particle can be used by any group. Each gauge makes a property of a particle, a measurement, and is specified
 * by group law.
 *
 *Theres yet more to that story. The group law specifies a type of composition, for all particles of the group. Then, each
 * particle composition is an instance of that composition type. So, composition type is where all those particle types
 * are used, as placeholders for actual particles in composition structures. But, you dont have to write out actual
 * particle type syntax,tho you can.The particle type is a particle itself, of groupName=type, flavorName=particle, a parametrized
 * particle with flavor props={groupName:'type'}
 * TODO: needs use cases
 *
 * Another way to think of particles. Particle specs are built at build time. Then, at run time, particle specs generate
 * particle instances. These instances are just bags of props, functions that spit out useful serializable entities, elements.
 * These elements are building blocks of serializable trees and graphs, each with its functionality and the rules of interactions
 * with neighbours, all defined by the group laws.
 *
 *   Glossary:
 *   particle - a specification for an element, similar to a type. A particle is specified as a composition typed by group law.
 *   Also, particle can be referenced by a particleRef from any group if transformation is allowed
 *
 *   parametrizedParticle - particles can be simple compositions or parametrized compositions. The latter are produced by
 *    a parametrized particle, a composition factory, a function
 *
 *   particleComposition - an object typed by the group law. Compositions are full of references to  other particles.
 *   When a particle is instantiated, composition is decomposed by gauges into element properties
 *
 *   particleElement - a particle instantiation.Produces an object with props specified by gauges in group law.
 *   Each gauge decomposes particle  composition in its own way.
 *
 *   particleFlavor - each particle composition is marked by a metadata object, flavor. flavor of a particle uniquely
 *   identifies a particle in the logic engine. Flavors can be simple names, or complex objects, or parametrized flavors
 *   marking parametrized particles
 *
 *   parametrizedParticleFlavor - a complex flavor marking a parametrized particle, product of a particle factory. All parametrized
 *   particles produced by a factory have the same flavor name, different props, and an optional unique typeName
 *
 *   simpleParticleFlavor - just a flavor name,indexing a non parametrized particle in a group
 *
 *   complexParticleFlavor - a more complicated flavor, an object including additional props
 *
 *   particleTransformPath - a property of a complex flavor. Specifies a transformation path of a particle,  along transforms
 *   described in group laws, traversing transform graph
 *
 *   typeName - additional classification of a parametrized particle flavor, to id products of flavor factory
 *
 *   flavorName - property of a flavor.Each particle has a unique flavor that indexes it in a group
 *
 *   particleSpec - specification of a particle as recorded in a group entry. Flavor names are stored separately
 *   inside an entry, so particleSpec does not have to specify a flavorName. A particleSpec can be a particle composition,
 *   or a particle reference
 *
 *   parametrizedParticleSpec - specifies a parametrized particle. Its a composition factory. In addition, the spec defines
 *   types of props the factory accepts. These prop types are defined by particle references to type particles, of type group.
 *
 *   particleStateSpec - particles are stateful.
 *   Particle state is defined in two places. The part of the state common to all the particles of the group is defined
 *   by group law.  Then, each particle can add its own custom state as long as its not in conflict with the common state.
 *   Heres what a particle state spec defines:
 *   * the shape of the state,
 *   the types of state props.
 *   * state constraints
 *   funcs restricting state props depending on other particles. In effect, these creates entanglements between related particles
 *   * actions
 *   all possible actions can be performed on the state. Each action can take a payload of props and mutates the state.
 *   The state is never mutated in place, rather, it is replaced with new object.
 *   * stateValues
 *   These are refinements of state shape, subtypes. Literal values of state props can be specified, as well as more complicated
 *   constraints. A particle can exist in a superposition of stateValues. StateValues are the only part of the state visible outside.
 *   Values of state props are not directly exposed, but only thru an array of stateValue names.
 *
 *   State constraints might prohibit some actions.Also, an action might modify the state of other related particles.
 *   All the state values and props are observables, and all functions are reactive, rerun on any change to any observable used
 *   inside of it.
 *
 * NOTE: flavor and state are reserved names, not to be used for prop names in particle compositions
 *
 * @module particleTypes
 */

import {
  Shape,
  stringType,
  Union,
  objectType,
  createVTypeFactory,
  ArrayType,
  Dict,
  v,
  functionType,
  parametrizedFlavor,
  simpleFlavor,
  Literal,
} from '../types'
import { logicEngineModel } from '../logicEngine.model'
import { Instance } from 'mobx-state-tree'
import { assert, mapShape } from '../utils'
import { particleClass } from './particle.class'

export type logicEngine = Instance<typeof logicEngineModel>

/**
 * Particle transform path
 * Specifies the particle transformation,from left to right,along allowed group transforms.
 * @category particle
 */
export type particleTransformPath = string[] | string

/**
 * vType asserting particle transform path.
 * see [[particleTransformPath]]
 * @remark a string name will be cast into string array
 * @category particle
 */
export const vParticleTransformPath = ArrayType({ type: stringType }).setCasts([
  {
    castName: 'string',
    fromType: stringType,
    cast: (string) => [string],
  },
])

/**
 * Simple particle ref
 * Specifies particle flavor name. Use it for shorthand
 * @category particle
 */
export type simpleParticleRef = string

/**
 * Complex particle ref
 * A metadata object uniquely identifying a particle
 * @category particle
 */
export interface complexParticleRef<flavorProps extends object = object> {
  /**
   * uniquely identifies particle in group
   */
  flavorName: string
  /**
   * Transform path, from left to right
   */
  transform?: particleTransformPath
  /**
   * unique id used to mark parametrized particles of the same flavorName
   */
  typeName?: string
  /**
   * for parametrized particles, props of particle factory
   */
  props?: flavorProps
  /**
   * this state will be superposed on the initial state coming from
   */
  initialState: string | string[]
}

/**
 * Particle ref
 * @category particle
 */
export type particleRef = simpleParticleRef | complexParticleRef

/**
 * particle ref type
 * see [[particleRef]]
 * Particle refs are used inside particle compositions.
 * They are decomposed into particle instances
 * @remark a simple particle ref is casted into complex ref
 * @param groupName group being referenced
 * if transform is not specified, it defaults to groupName
 * @category particle
 */
export const vParticleRef = createVTypeFactory<particleRef, { groupName: string }>({
  assert: ({ props: { groupName } }) => (ref) => {
    const { transform } = vUnflavoredParticleRef.create(ref, `ref of group ${groupName}`)
    const targetGroup = transform.reverse()[0] || groupName
    assert(groupName === targetGroup, `bad transform in flavor ${ref} for group ${groupName}`)
  },
  create: ({ props: { groupName } }) => (value) => {
    const particleRef = vUnflavoredParticleRef.create(value)
    const { transform } = particleRef
    !transform.length && transform.push(groupName)
    return particleRef as particleRef
  },
  flavorName: 'particleRef',
})

/**
 * @ignore
 */
export const vUnflavoredParticleRef = Shape({
  propTypes: {
    flavorName: stringType.refined((flavorName) => assert(!!flavorName, `flavorName can not be empty`)),
    transform: vParticleTransformPath.defaultsTo([]),
    typeName: stringType.defaultsTo(''),
    props: objectType.defaultsTo({}),
  },
}).setCasts([
  {
    castName: 'simpleParticleRef',
    fromType: stringType,
    cast: (flavorName) => ({ flavorName }),
  },
])

/**
 * complex particle flavor
 * a metadata object uniquely identifying a particle within logic engine
 * @typeParam flavorProps props of particle factory for parametrized flavors
 * @category particle
 */
export interface complexParticleFlavor<flavorProps extends object = object>
  extends Partial<parametrizedFlavor<flavorProps>> {
  /**
   * particle transform. An array of group names, along one of the allowed paths
   * Transform funcs are defined in grouo laws, casting compositions from one group to another
   */
  transform?: particleTransformPath
}

/**
 * particle flavor
 * a union of all possible ways to specify particle flavor
 * @category particle
 */
export type particleFlavor<flavorProps extends object = object> = simpleFlavor | complexParticleFlavor

/**
 * particle flavor vType
 * Its a type factory
 * particle type has its own particle flavor
 * see [[particleFlavor]]
 * @param typeName [[types.stringType]]=''  an optional particle name, in addition to flavor name
 * use to identify particles generated by particle factories. Such particles assume the flavor of factory, so an additional
 * classification can be useful
 * @param flavorName [[vParticleTransformPath]] particle flavor name, uniquely identifying particle in its group
 * @param props [[types.objectType]]={} props of parametrized particles.must be of type specified by particle spec
 * @category particle
 */
export const vParticleFlavor = createVTypeFactory<particleFlavor, { groupName: string }>({
  assert: ({ props: { groupName } }) => (flavor) => {
    const { transform } = vUnflavoredParticleFlavor.create(flavor, `flavor of group ${groupName}`)
    const targetGroup = transform.reverse()[0] || groupName
    assert(groupName === targetGroup, `bad transform in flavor ${flavor} for group ${groupName}`)
  },
  create: ({ props: { groupName } }) => (value) => {
    const flavor = vUnflavoredParticleFlavor.create(value)
    const { transform } = flavor
    !transform.length && transform.push(groupName)
    return flavor
  },
  flavorName: 'particleFlavor',
})

/**
 * @ignore
 */
export const vUnflavoredParticleFlavor = Shape({
  propTypes: {
    typeName: stringType.defaultsTo(''),
    flavorName: stringType.defaultsTo(''),
    transform: vParticleTransformPath.defaultsTo([]),
    props: objectType.defaultsTo({}),
  },
}).setCasts([
  {
    castName: 'simpleFlavor',
    fromType: stringType,
    cast: (flavorName: string) => ({ flavorName }),
  },
])

/**
 * Particle composition
 * its simply an object that might have a flavor prop
 * Whats inside are references to other particles
 * {@link vParticleComposition}
 * @typeParam flavorProps props of parametrized flavor
 * @category particle
 */
export interface particleComposition<flavorProps extends object = object> {
  /**
   * particle flavor
   */
  flavor?: particleFlavor
  /**
   * particle state extends the common state defined by group law
   */
  state?: stateSpec
  /**
   * any additional structure
   */
  [key: string]: any
}

/**
 * @ignore
 */
const vUnflavoredParticleComposition = (groupName: string) =>
  Shape({
    propTypes: {
      flavor: vParticleFlavor({ groupName }).defaultsTo({}),
      state: vUnflavoredStateSpec.defaultsTo({}),
    },
    isStrict: false,
  })

/**
 * Particle composition vType factory
 * Has flavor of particleComposition
 * Its a shape marked by particle flavor,maybe, when needed
 * Composition is full of references to other particles within the logic system
 * Composition is decomposed by gauges into particle properties, when particle is instantiated into an element
 * @category particle
 */
export const vParticleComposition = createVTypeFactory<particleComposition, { groupName: string }>({
  assert: ({ props: { groupName } }) => (composition) =>
    vUnflavoredParticleComposition(groupName).assert(
      composition,
      `bad composition ${composition} for group ${groupName}`
    ),
  create: ({ props: { groupName } }) => (composition) =>
    vUnflavoredParticleComposition(groupName).create(composition) as particleComposition,
  flavorName: 'particleComposition',
})

/**
 * particle
 * [[vParticle]]
 */
export type particle = particleRef | particleComposition

/**
 * @ignore
 */
const vUnflavoredParticle = (groupName: string) =>
  Union({
    types: [vParticleRef({ groupName }), vParticleComposition({ groupName })],
  })

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
export const vParticle = createVTypeFactory<particle, { groupName: string }>({
  flavorName: 'particle',
  assert: ({ props: { groupName } }) => (particle) =>
    vUnflavoredParticle(groupName).assert(particle, `bad particle ${particle} of groupName ${groupName}`),
  create: ({ props: { groupName } }) => (particle) => vUnflavoredParticle(groupName).create(particle),
})

/**
 * parametrized particle spec
 * This is how a parametrized particle is specified to be added to a particle group.
 * @category particle
 */
export interface parametrizedParticleSpec {
  /**
   * lists types of props for the composition factory
   * each prop type is a reference to a particle of type group, a type composition
   */
  props: {
    [propName: string]: particle
  }
  /**
   * particle composition factory. Takes props, returns particle composition. Its missing
   * the flavor prop. Flavor is implied and added when particle is exposed thru the [[particleGroup.read]] method.
   * @param props these are props specified above
   */
  spec: (props: object) => particleComposition
}

/**
 * Particle spec
 * This is how a particle is specified when adding into a group
 * It can be either a parametrized spec, a particle composition or a flavor referencing existing particle
 * Each particle is identified in its group with its own unique flavorName.
 * If flavor prop is present in composition, it is only to indicate a transform path.  Composition is written
 * for the source particle, and transformed to the target via transform path
 *
 * Particle specs are used to add particles to groups. The flavorName is supplied separate from the spec.
 * @category particle
 */
export type particleSpec = parametrizedParticleSpec | particleComposition | particleRef

/**
 * Parametrized particle composition vType factory
 * see [[parametrizedParticleSpec]]
 * Particles of a group can be simple compositions or composition factories
 * Parametrized composition takes props and produces particle composition, of its flavor. A distinct
 * typeName can be given to identify particles of same flavorName
 * @remark particle compositions in particle specs do not have to have flavor. Flavor is specified separately when adding
 * particle to a group.
 * @param props dict of type particles, defining types of props of the composition factory
 * @param composition function, composition factory
 * @category particle
 */
export const vParametrizedParticleSpec = Shape({
  propTypes: {
    props: Dict({ type: vParticle({ groupName: 'type' }) }),
    composition: functionType,
  },
})

/**
 * @ignore
 */
const vUnflavoredParticleSpec = (groupName: string) =>
  Union({
    types: [vParametrizedParticleSpec, vParticleRef({ groupName }), vParticleComposition({ groupName })],
  })

/**
 * Particle spec, type factory of flavor 'particleSpec'
 * Each particle of a group is specified by this particle spec. This is what is used for insert operation, into group.
 * Particles can be [simple compositions](particleComposition) or [parametrized composition](parametrizedParticleComposition) or references
 * to other particles thru their flavor, with transforms pointing to correct group.
 * which are functions spitting out composition after getting some props. The prop types are defined by a [[particle]] of type group.
 * @category particle
 */
export const vParticleSpec = createVTypeFactory<particleSpec, { groupName: string }>({
  assert: ({ props: { groupName } }) => (spec) =>
    vUnflavoredParticleSpec(groupName).assert(spec, `bad spec ${spec} for group ${groupName}`),
  create: ({ props: { groupName } }) => (spec) => vUnflavoredParticleSpec(groupName).create(spec),
  flavorName: 'particleSpec',
})

/**
 * Part of state spec
 * A function constraining values of state props. Its reactive, reruns on change of any observables its using
 * On each change of an observable, the function returns an object with state prop values, not the whole state tho.
 * In effect, this is a way to entangle particle, deriving a particle state from state values of other particles
 * Note that only stateValues of entangled particles are observable, not state prop values.
 * @param particle a particle element, instance of [[particleClass.particleClass]]
 * @param state state prop values
 */
export interface stateConstraint {
  (particle: particleClass, state: object): object
}

/**
 * State spec defines all possible actions , the way to modify particle state.
 * The state can be modified only by these actions. The state is never mutated in place, but a new state object
 * is created.
 * An action takes payload props, and returns a mutator object, to be extended over the old state prop values
 * @param particle a particle element, instance of [[particleClass.particleClass]]
 * @param state state prop values
 */
export interface stateAction {
  (particle: particleClass, state: object): (payload: object) => object
}

/**
 * Specifies one of state actions
 * Just a [[stateAction]] function can be used if action does not take any payload
 */
export type stateActionSpec =
  | {
      /**
       * Specifies types of state props.
       * By referencing type particles, or by freehand type compositions
       */
      payloadPropTypes: {
        [propName: string]: particle
      }
      action: stateAction
    }
  | ((particle: particleClass, state: object) => () => object)

/**
 * see [[stateActionSpec]]
 */
export const vStateActionSpec = Shape({
  propTypes: {
    payloadPropTypes: Dict({ type: vParticle({ groupName: 'type' }) }).defaultsTo({}),
    action: functionType,
  },
}).setCasts([
  {
    castName: 'no payload',
    fromType: functionType,
    cast: (action) => ({ action }),
  },
])

/**
 * States can have discrete value given by names
 * State value is associated with a type, given by a refinement function, an extra assertion on state shape.
 * State is said to have a particular stateValue when this state value assertion is satisfied
 * A particle can be in superposition of several state values
 * State values are the only part of the particle state visible outside,as an array of state value names
 * If state value assertion is given by an object, the props of that object are literal values of state props
 */
export type stateValueAssertion = object | ((state: object) => void)

/**
 * see [[stateValueAssertion]]
 */
export const vStateValueAssertion = functionType.setCasts([
  {
    castName: 'literalPropValues',
    fromType: objectType,
    cast: (literalValues: object) => {
      return (state: object) => {
        Shape({
          propTypes: mapShape(literalValues, (value) => Literal({ value })),
          isStrict: false,
        }).assert(state)
      }
    },
  },
])

/**
 * Specifies all attributes of particle state
 * Particle state lives in two places. The part common to all particles of a group lives in group law.
 * Then, each particle of a group can add custom part of the state
 */
export interface stateSpec {
  /**
   * defines state shape, specified by references to type particles
   */
  propTypes: {
    [propName: string]: particle
  }
  /**
   * reactive functions constraining state prop values.
   * see [[stateConstraint]]
   */
  constraints?: {
    [name: string]: stateConstraint
  }
  /**
   * all possible actions that can modify the state shape
   * State can be modified only thru actions
   * see [[stateAction]]
   */
  actions?: {
    [name: string]: stateActionSpec
  }
  /**
   * state values visible from outside of a particle
   * This is particle API. State shape is not visible directly
   * see [[stateValueAssertion]]
   */
  stateValues?: {
    [name: string]: stateValueAssertion
  }
}

/**
 * @ignore
 */
const vUnflavoredStateSpec = Shape({
  propTypes: {
    propTypes: Dict({ type: vParticle({ groupName: 'type' }) }),
    constraints: Dict({ type: functionType }).defaultsTo({}),
    actions: Dict({ type: vStateActionSpec }).defaultsTo({}),
    stateValues: Dict({ type: vStateValueAssertion }).defaultsTo({}),
  },
})

/**
 * State spec type factory
 * group state spec is the flavor prop
 * This type is used in composition types, as part of group law.
 * State spec asserts the additional state of the particle does not name clash with group state spec.
 * Create method of the type merges group state with custom particle state
 */
export const vStateSpec = createVTypeFactory<stateSpec, stateSpec>({
  flavorName: 'state',
  assert: ({ props: commonState }) => (particleStateSpec: stateSpec) => {
    const uniquePropNames = (particleStateSpecValue: object) => {
      const unique = (stateSpecPropName: string) => {
        mapShape((particleStateSpecValue as stateSpec)[stateSpecPropName] || {}, (propValue, propName) =>
          assert(
            !(commonState[stateSpecPropName] || {}).hasOwnProperty(propName),
            `${propName} of ${stateSpecPropName} not unique`
          )
        )
      }

      mapShape(commonState, (prop, propName) => unique(propName))
    }

    vUnflavoredStateSpec
      .refined(uniquePropNames)
      .assert(particleStateSpec, `bad particle state spec ${particleStateSpec}`)
  },
  create: ({ props: commonState }) => (particleState: stateSpec) => {
    const normalizedCommonState = vUnflavoredStateSpec.create(commonState)
    const normalizedParticleState = vUnflavoredStateSpec.create(particleState)

    return vUnflavoredStateSpec.create(
      mapShape(normalizedCommonState, (commonProp, propName) => ({
        ...commonProp,
        ...normalizedParticleState[propName],
      }))
    ) as stateSpec
  },
})
