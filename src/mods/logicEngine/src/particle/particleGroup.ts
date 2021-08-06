/**
 * Particle groups are collections of particles described by the same (particle group law){particleGroupLaw.particleGroupLaw}
 * Groups are similar to collections, with a set of crud like methods to add, remove and update particles.
 * Any particle, entry in a group can be either scripted or volatile. Scripted particles are serializable and persistent.
 * Volatile particles live in hard code. Particles can be easily updated between volatile and scripted form.
 * Particles are uniquely identified by their flavorName, and described by [[particleTypes.particleSpec]].
 * Particles can be simple [[particleTypes.particleComposition]] or [[particleTypes.parametrizedParticleComposition]],
 * particle composition factory. A [[particleTypes.parametrizedParticleSpec]] defines types of props the factory takes.
 * Prop types are defined by  particles of type group, either a reference by flavor or a shorthand type composition.
 * Particles can be specified by references to other particles, as just a flavor, with transform path.
 * @module particleGroup
 */

import { Instance, types as t } from 'mobx-state-tree'
import { assert, LogicError, mapShape, toArray, vm } from '../utils'
import { vClass, Shape, stringType, Union, Refine, Func, objectType } from '../types'
import type {
  particleFlavor,
  particleSpec,
  particleRef,
  particle,
  particleComposition,
  particleTransformPath,
  complexParticleFlavor,
  complexParticleRef,
  pa,
} from './particle.types'
import {
  vParametrizedParticleSpec,
  vParticleComposition,
  vParticleFlavor,
  vParticleRef,
  vParticleSpec,
} from './particle.types'
import { particleClass as particleClassFactory } from './particle.class'
import { particleTransform } from './particleTransform'

/**
 * Group entry
 * {@see vEntry}
 * @category particleGroup
 */
interface entry {
  /**
   * Flavor name uniquely identifying particle
   * @remark: Parametrized particle can generate other particles of its flavor, but of different type names
   */
  flavorName: string
  /**
   * Particle spec
   * If string, its a script generating [[particleTypes.particleSpec]]
   */
  spec: string | particleSpec
}

/**
 * mst model of scripted entry
 * These are serializable and persistent, as opposed to volatile
 * @category particleGroup
 * see [[entry]]
 */
const tScriptedEntry = t.model('scriptedEntry', {
  flavorName: t.string,
  spec: t.string,
})

/**
 * Scripted group entry type
 * see [[tScriptedEntry]]
 * @category particleGroup
 */
const vScriptedEntry = Shape({
  propTypes: {
    flavorName: stringType,
    spec: stringType,
  },
})

const findIn = (entries: entry[]) => (name): entry | undefined =>
  entries.find(({ flavorName }: entry) => name === flavorName)

const insertIn = (entries: entry[]) => (entry): number => entries.push(entry)

const deleteIn = (entries: entry[]) => (name): boolean => {
  const index = entries.findIndex(({ flavorName }: entry) => name === flavorName)
  if (index < 0) return false
  entries.splice(index, 1)
  return true
}

/**
 * particle group
 * Its mst model
 * Its a collection of particles, with a set of crud methods to add, remove and update particles.
 */
export interface particleGroup {
  /**
   * The law of this group
   * It specifies all needed to build the group
   */
  law: particleGroupLaw
  /**
   * Read particle
   * @param particleRef
   * @param errMsg if error is thrown, this is part of the error message
   * @throws if flavorName is not found, or particleRef is malformed
   * @returns instance of a particle
   */
  read: (particleRef: particleRef, errMsg: string) => Instance<particleClass>
  /**
   * Either updates existing particle or inserts new one
   * @param flavorName
   * @param particleSpec
   * @param errMsg if error is thrown, this is part of the error message
   * @throws if particleSpec is malformed
   */
  upsert: (flavorName: string, particleSpec: particleSpec, errMsg: string) => void
  /**
   * updates existing particle
   * @param flavorName
   * @param particleSpec
   * @param errMsg if error is thrown, this is part of the error message
   * @throws if particle not found, or particleSpec is malformed
   */
  update: (flavorName: string, particleSpec: particleSpec, errMsg: string) => void
  /**
   * inserts new particle
   * @param flavorName
   * @param particleSpec
   * @param errMsg if error is thrown, this is part of the error message
   * @throws if particle exists
   */
  insert: (flavorName: string, particleSpec: particleSpec, errMsg: string) => void
  /**
   * deletes existing particle
   * @param flavorName
   * @param errMsg if error is thrown, this is part of the error message
   * @throws if particle not found
   */
  delete: (flavorName: string, errMsg: string) => void
}

/**
 * mst model of particle group
 * see [[particleGroup]]
 * @param logicEngine
 * @param law
 */
export const particleGroupModel = (logicEngine: Instance<logicEngineModel>) => (law: particleGroupLaw) => {
  const { groupName, compositionType } = law

  /**
   * Entry in the group, specifying a particle
   * Each entry,particle is uniquely identified by its flavorName, recorded separately from [[particleTypes.particleSpec]]
   * Entries can be scripted, serializable, and persistent, living outside of client local memory.
   * Entries can be specified as volatile, when particle spec is javascript code rather then string. Volitile entries are
   * usually come from hard code, as part of js bundle to client.
   * Same particle can be easily updated between volatile and persistent kind.
   * {@see entry}
   */
  const vEntry = Shape({
    propTypes: {
      flavorName: stringType,
      spec: vParticleSpec({ groupName }),
    },
  }).setCasts([
    {
      castName: 'script',
      fromType: vScriptedEntry,
      cast: (flavor) => {
        const { flavorName, spec: script } = flavor
        const vm = logicEngine.vm
        try {
          return { flavorName, spec: vm.run(script) }
        } catch (e) {
          throw new LogicError(`bad particleSpec script for flavor=${flavor}`, e)
        }
      },
    },
  ])

  const groupErrMsg = `group ${self.name}`

  return t
    .model('collectionModel', {
      name: t.literal(groupName),
      persistentEntries: t.optional(t.array(tScriptedEntry), []),
    })
    .views((self) => ({
      get law() {
        return law
      },
    }))
    .actions((self) => {
      const volatileEntries: entry[] = []

      const entries = (which: 'persistent' | 'volatile' | entry): entry[] => {
        return which === ('persistent' || tScriptedEntry.is(which)) ? self.persistentEntries : volatileEntries
      }

      //implements crud
      return {
        read(particleRef: particleRef, errMsg: string = ''): Instance<particleClass> {
          const localErrMsg = `reading particleRef ${particleRef}`

          if (!vParticleRef({ groupName }).is(particleRef))
            return particleTransform(logicEngine)(particleRef as particleComposition, [
              groupErrMsg,
              localErrMsg,
              errMsg,
            ])

          const { flavorName, props: flavorProps } = vParticleRef({ groupName }).create(particleRef, [
            groupErrMsg,
            localErrMsg,
            errMsg,
          ]) as complexParticleRef

          const entry = findIn(entries('persistent'))(flavorName) || findIn(entries('volatile'))(flavorName)

          assert(!!entry, [groupErrMsg, localErrMsg, `can not find flavor`, errMsg])

          const {
            spec: { props: flavorPropTypes, composition: compositionFactory },
          } = vEntry.create(entry, [groupErrMsg, localErrMsg, errMsg])

          const vFlavorPropsTypes = Shape({
            propTypes: mapShape(flavorPropTypes, (propTypeParticle, propName) =>
              logicEngine.groups.types.read(propTypeParticle, [groupErrMsg, localErrMsg, errMsg])
            ),
          })

          const particleComposition = Func({
            args: [vFlavorPropsTypes],
            result: compositionType,
          }).create(compositionFactory)(flavorProps, [groupErrMsg, localErrMsg, errMsg])

          return particleTransform(Object.assign(particleComposition, particleRef))
        },

        upsert(flavorName: string, particleSpec: particleSpec, errMsg: string = '') {
          const localErrMsg = `upsert of flavorName ${flavorName},spec ${particleSpec}`

          const entry = vEntry.create(
            {
              flavorName,
              spec: particleSpec,
            },
            [groupErrMsg, localErrMsg, errMsg]
          ) as entry

          try {
            this.delete(flavorName)
          } catch (e) {}

          insertIn(entries(entry))(entry)
        },

        update(flavorName: string, particleSpec: particleSpec, errMsg: string = '') {
          const localErrMsg = `update of flavorName ${flavorName},spec ${particleSpec}`

          const entry = vEntry.create(
            {
              flavorName,
              spec: particleSpec,
            },
            [groupErrMsg, localErrMsg, errMsg]
          ) as entry

          try {
            this.delete(flavorName)
          } catch (e) {
            throw new LogicError([groupErrMsg, localErrMsg, `particle does not exists`, errMsg])
          }

          insertIn(entries(entry))(entry)
        },

        insert(flavorName: string, particleSpec: particleSpec, errMsg: string = '') {
          const localErrMsg = `insert of flavorName ${flavorName},spec ${particleSpec}`

          const entry = vEntry.create(
            {
              flavorName,
              spec: particleSpec,
            },
            [groupErrMsg, localErrMsg, errMsg]
          ) as entry

          const oldEntry = findIn(entries(entry))(entry)
          assert(!!oldEntry, [groupErrMsg, localErrMsg, `entry exists`, errMsg])

          insertIn(entries(entry))(entry)
        },

        delete(flavorName: string, errMsg: string = '') {
          const localErrMsg = `delete flavorName ${flavorName}`

          assert(deleteIn(entries('persistent'))(flavorName) || deleteIn(entries('volatile'))(flavorName), [
            groupErrMsg,
            localErrMsg,
            'entry does not exist',
            errMsg,
          ])
        },
      }
    })
}
