import { IAnyModelType, IAnyType,IModelType,SnapshotOrInstance, Instance,types as t} from 'mobx-state-tree'
import {MWithId} from './utils'

const MBlockDef=t.compose('block',MWithId,t.model('',{

}))

export default MBlockDef