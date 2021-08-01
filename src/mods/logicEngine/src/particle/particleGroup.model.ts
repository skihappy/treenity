import {Instance, types as t} from 'mobx-state-tree'
import {assert, LogicError, mapShape, toArray, vm} from '../utils'
import {vClass, Shape, stringType, Union, Refine, Func, objectType} from '../types'
import type {particleFlavor, particleSpec, particle, particleComposition, particleTransformPath} from './particle.types'
import {
    vParametrizedParticleSpec,
    vParticleComposition,
    vParticleFlavor,
} from "./particle.types"
import {particleClass as particleClassFactory} from './particle.class'
import {particleTransform} from "./particleTransform";

interface entry {
    flavorName: string
    spec: string | particleSpec
}

const tScriptedEntry = t.model('scriptedEntry', {
    flavorName: t.string,
    spec: t.string,
})

const vScriptedEntry=Shape({
    propTypes:{
        flavorName: stringType,
        spec: stringType
    }
})

const vParticleSpec=vParametrizedParticleSpec.setCasts([
    {
        castName:'particleComposition',
        fromType:vParticleComposition,
        cast:composition=>({spec:()=>composition})
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
            spec:vParticleSpec,
        }
    }).setCasts([{
        castName: 'script',
        fromType: vScriptedEntry,
        cast:(flavor)=>{
            const {flavorName,spec:script}=flavor
            const vm=logicEngine.vm
            try{
                return {flavorName,spec:vm.run(script)}
            }catch(e){
                throw new LogicError(`bad particleSpec script for flavor=${flavor}`,e)
            }
        }
    }])

    const groupErrMsg=`group ${self.name}`

    return t
        .model('collectionModel', {
            name: t.literal(groupName),
            persistentEntries: t.optional(t.array(tScriptedEntry), []),
        })
        .views((self) => ({
            assert(guard: boolean, errMessage?: string | string[]) {
                assert(guard, [groupErrMsg, ...toArray(errMessage)])
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
                    const localErrMsg=`reading particle ${particle}`
                    if(!vParticleFlavor.is(particle as object))
                        return particleTransform(logicEngine)(particle,[groupErrMsg,localErrMsg])
                    const particleFlavor = vParticleFlavor.create(particle as particleFlavor,`bad reference, group ${groupName}`)
                    const { flavorName:flavorNameArray, props: flavorProps }=particleFlavor

                    assert(flavorNameArray.length===1,`flavor name can not be `)
                    const entry =
                        findIn(entries('persistent'))(flavorName) ||
                        findIn(entries('volatile'))(flavorName)

                    self.assert(!!entry, [`read: can not find flavor ${flavorName}`, errMsg])

                    const {particleSpec:{props:flavorPropTypes,spec:specFactory}}=
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

                    const particleComposition=Func({
                        args:[vFlavorPropsTypes],
                        result:compositionType
                    }).create(specFactory)(flavorProps,`reading flavor=${particleFlavor}`)

                    return particleTransform(Object.assign(particleComposition, particleFlavor))
                },


                upsert(flavorName:particleTransformPath,particleSpec: particleSpec, errMsg: string = '') {
                    const entry=vEntry.create({
                        flavorName,
                        spec:particleSpec
                    },[errMsg,`upsert of group ${groupName} for flavorName ${flavorName}`])

                    try {
                        this.delete(flavorName)
                    } catch (e) {}

                    insertIn(entries(entry as entry))(entry)
                },

                update(flavorName:particleTransformPath,particleSpec: particleSpec, errMsg: string = '') {
                    const entry=vEntry.create({
                        flavorName,
                        spec:particleSpec
                    },[errMsg,`update of group ${groupName} for flavorName ${flavorName}`])

                    try{
                        this.delete(flavorName)
                    }catch(e){
                        throw new LogicError([`update: particle ${flavorName} does not exists`, errMsg])
                    }
                    verify(() => this.delete(name), [`update: entry ${name} does not exists`, errMsg])
                    insertIn(entries(entry))
                },                    const { name, value } = entry


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
