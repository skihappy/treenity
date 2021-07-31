import {Instance, types as t} from 'mobx-state-tree'
import {assert, LogicError, mapShape, toArray, vm} from '../utils'
import {vClass, Shape, stringType, Union, Refine, Func} from '../types'
import type {particleFlavor, particleSpec, particle, particleComposition} from './particle.types'
import {vParametrizedParticleComposition, vParticleComposition, vParticleFlavor, vParticleSpec} from "./particle.types"
import {particleClass as particleClassFactory} from './particle.class'
import {particleTransform} from "./particleTransform";

interface entry {
    flavorName: string
    particleSpec: string | particleSpec
}

const tScriptedEntry = t.model('scriptedEntry', {
    flavorName: t.string,
    particleSpec: t.string,
})

const vScriptedEntry=Shape({
    propTypes:{
        flavorName: stringType,
        particleSpec: stringType
    }
})

const vParticleSpec=vParametrizedParticleComposition.setCasts([
    {
        castName:'particleComposition',
        fromType:vParticleComposition,
        cast:composition=>({composition:()=>composition})
    }
])

const findIn = (entries: entry[]) => (name): entry | undefined =>
    entries.find(({ flavorName }: entry) => name === flavorName)

const insertIn = (entries: entry[]) => (entry): number => entries.push(entry)

const deleteIn = (entries: entry[]) => (name): boolean => {
    const index = entries.findIndex(({ flavorName }: entry) => name === flavorName)
    if (index < 0) return false
    entries.splice(index, 1)
    return true
}

export const particleGroupModel = (logicEngine:Instance<logicEngineModel>)=> (law:particleGroupLaw) => {
    const {groupName,compositionType}=law

    const vEntry=Shape({
        propTypes:{
            flavorName:stringType,
            particleSpec:vParticleSpec,
        }
    }).setCasts([{
        castName: 'script',
        fromType: vScriptedEntry,
        cast:(flavor)=>{
            const {flavorName,particleSpec:script}=flavor
            const vm=logicEngine.vm
            try{
                return {flavorName,particleSpec:vm.run(script)}
            }catch(e){
                throw new LogicError(`bad particleSpec script for flavor=${flavor}`,e)
            }
        }
    }])

    return t
        .model('collectionModel', {
            name: t.literal(groupName),
            persistentEntries: t.optional(t.array(tScriptedEntry), []),
        })
        .views((self) => ({
            assert(guard: boolean, errMessage?: string | string[]) {
                assert(guard, [`group ${self.name}`, ...toArray(errMessage)])
            },
        }))
        .actions((self) => {
            const volatileEntries: entry[] = []

            const entries = (which: 'persistent' | 'volatile' | entry): entry[] => {
                return which === ('persistent' || tScriptedEntry.is(which)) ? self.persistentEntries : volatileEntries
            }

            const verify = (func: () => any, errMessage?: string | string[]) => {
                try {
                    func()
                } catch (e) {
                    self.assert(false, errMessage)
                }
            }
            //implements crud
            return {
                read(particle:particle,errMsg:string='') {
                    if(vParticleComposition.is(particle as object))
                        return particleTransform(logicEngine)(particle,`read of group ${groupName}`)
                    const particleFlavor = vParticleFlavor.create(particle as particleFlavor,`bad reference, group ${groupName}`)
                    const { typeName,flavorName, props: flavorProps }=particleFlavor

                    const entry =
                        findIn(entries('persistent'))(flavorName) ||
                        findIn(entries('volatile'))(flavorName)

                    self.assert(!!entry, [`read: can not find flavor ${flavorName}`, errMsg])

                    const {particleSpec:{props:flavorPropTypes,composition:compositionFactory}}=
                        vEntry.create(entry,`read bad entry=${entry}`)

                    const vFlavorPropsTypes=Shape({
                        propTypes:mapShape(
                            flavorPropTypes,
                            (propTypeParticle,propName)=>logicEngine.groups.types.read(
                                propTypeParticle,
                                `reading flavor=${particleFlavor}`
                            )
                        )
                    })

                    const composition=Func({
                        args:[vFlavorPropsTypes],
                        result:compositionType
                    }).create(compositionFactory)(flavorProps,`reading flavor=${particleFlavor}`)

                    return particleTransform(composition`)
                },


                upsert(entry: entry, errMsg: string = '') {
                    verify(() => vEntry.assert(entry), ['upsert:  bad entry', errMsg])
                    const { name, value } = entry
                    try {
                        this.delete(name)
                    } catch (e) {}
                    insertIn(entries(entry))(entry)
                },

                update(entry: entry, errMsg) {
                    verify(() => vEntry.assert(entry), ['update:  bad entry', errMsg])
                    const { name, value } = entry
                    verify(() => this.delete(name), [`update: entry ${name} does not exists`, errMsg])
                    insertIn(entries(entry))
                },

                insert(entry: entry, errMsg: string = '') {
                    verify(() => vEntry.assert(entry), ['insert:  bad entry', errMsg])
                    const { name, value } = entry
                    verify(() => this.read(name), [`insert: entry ${name} already exists`, errMsg])
                    insertIn(entries(entry))
                },

                delete(name: string, errMsg: string = '') {
                    self.assert(deleteIn(entries('persistent'))(name) || deleteIn(entries('volatile'))(name), [
                        `delete: entry ${name} does not exist`,
                        errMsg,
                    ])
                },
            }
        })
}
