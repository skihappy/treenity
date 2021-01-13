import { IAnyModelType, IAnyType,IModelType,SnapshotOrInstance, Instance,types as t} from 'mobx-state-tree'
import MBlockDef from './blockDef.model'
import MCast from './cast.model'

export const builtInCasts:Instance<typeof MCast>[]=[]
export const builtInBlockDefs:Instance<typeof MBlockDef>[]=[]

type   type:IAnyType,
    name:string =[name:string,type:IAnyType]
export const builtInPinValueTypes:IPinValueTypeEntry[]=[
    ['string',t.string],
    ['number',t.number],
    ['integer',t.integer],
    ['Date',t.Date],
    ['boolean',t.boolean],
    ['null',t.null],
    ['undefined',t.undefined]
]


