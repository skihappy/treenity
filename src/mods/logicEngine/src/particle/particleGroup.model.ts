import {Instance, types as t} from 'mobx-state-tree'
import {assert, mapShape, toArray, vm} from '../utils'
import { vClass, Shape, stringType, Union, Refine } from '../types'
import type {particleFlavor, particleSpec, particle, particleComposition} from './particle.types'
import {vParticleComposition, vParticleFlavor} from "./particle.types"
import {particleClass as particleClassFactory} from './particle.class'

interface entry {
    name: string
    value: any
}

const tScriptedEntry = t.model('scriptedEntry', {
    name: t.string,
    value: t.string,
})


const findIn = (entries: entry[]) => (name): entry | undefined =>
    entries.find(({ name: entryName }: entry) => name === entryName)

const insertIn = (entries: entry[]) => (entry): number => entries.push(entry)

const deleteIn = (entries: entry[]) => (name): boolean => {
    const index = entries.findIndex(({ name: entryName }: entry) => name === entryName)
    if (index < 0) return false
    entries.splice(index, 1)
    return true
}

export const particleGroupModel = (logicEngine:Instance<logicEngineModel>)=> (law:particleGroupLaw) => {
    const particleClass=particleClassFactory(law)
    const {groupName}=law
    const vScriptedValue = Refine(
        {
            type: stringType,
            refine: () => (script) => vNakedValue.assert(vm.run(script)),
        },
        'scriptedValue'
    )

    const vEntry = Shape(
        {
            propTypes: {
                name: stringType,
                value: Union({
                    types: [vNakedValue, vScriptedValue],
                }),
            },
            helpers: {
                nakedValue: ({ name, value }) => (vScriptedValue.is(value) ? vm.run(vm.run(value as string)) : value),
            },
        },
        'entry'
    )

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
                    if(vParticleComposition.is(particle))return new particleClass(particle as particleComposition)
                    const { typeName,flavorName, props: flavorProps } =
                        vParticleFlavor.create(flavor,`bad reference, group ${self.name}`)

                    const entry =
                        findIn(entries('persistent'))(flavorName) ||
                        findIn(entries('volatile'))(flavorName)

                    self.assert(!!entry, [`read: can not find flavor ${flavorName}`, errMsg])

                    const vFlavorProps=Shape({
                        propTypes:mapShape(flavorProps,(prop,propName)=>logicEngine.groups.types.read())
                    })
                    const registryValue = self.read(componentName)
                    const componentSpec = vElementSpec.is(registryValue)
                        ? { component: () => registryValue, props: {} }
                        : registryValue

                    const componentPropTypes = mapShape(componentSpec.props, (typeRef) =>
                        logicEngine.registries.types.read(typeRef)
                    )
                    const vComponentProps = Shape(
                        {
                            propTypes: componentPropTypes,
                        },
                        `props of ${componentName} of ${registryName}`
                    )

                    const render = Func(
                        {
                            args: [vComponentProps],
                            result: vElementSpec,
                        },
                        `${componentName} component of ${registryName} registry`
                    ).create(componentSpec.component)(componentProps)

                    return new elementClass(render(componentProps))
                },
                read(name: string, errMsg: string = ''): any {
                    const entry = findIn(entries('persistent')) || findIn(entries('volatile'))
                    self.assert(!!entry, [`read: can not find entry ${name}`, errMsg])
                    return vEntry.create(entry, errMsg).nakedValue
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
