import { types as t ,Instance} from 'mobx-state-tree'
import { modelWithID, tRainbowArray } from '../../utils'
import MScriptedFuncDef from '../../scriptedFuncDef.class'
import MRegistry from '../../registry.model'

export interface IBlockSpec {}

export default (logicEngine) => {
    const setupScriptedFunc=()=>{
        return MScriptedFuncDef(logicEngine).create().MScriptedFunc.actions(self=>{
            return {

            }
        })
    }

    return modelWithID('MBlock', {
        blocks:
    })
}