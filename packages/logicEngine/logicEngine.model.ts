import { IAnyModelType, IAnyType,IModelType,SnapshotOrInstance, Instance,types as t} from 'mobx-state-tree'
import {MWithId} from './utils'
import MBlockDef from './blocDef.model'
import {builtInCasts,builtInBlockDefs,builtInPinValueTypes} from './builtIns'
import MCast from './cast.model'

const tPinValueTypeEntry=t.refinement(t.array,(array)=(array.length===2 && typeof array[0]==='string')))
const MLogicEngine=t.compose('logicEngine',MWithId,t.model('',{
    pinTypes:t.optional(t.array,builtInPinTypes),
    blockDefs:t.optional(t.array(MBlockSeed),builtInBlockSeeds),
    casts:t.optional(t.array(MCast),builtInCasts),
})).actions(self=>{
    return {
        add:()
        addBlockModel:(blockModel)=>{
            self.blockModels.push(blockModel)
        },
        addCast:(cast:Instance<typeof MCast>)=>{
            self.casts.push(cast)
        },
    }
})