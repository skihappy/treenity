import { IAnyModelType, IAnyType,IModelType,SnapshotOrInstance, Instance,types as t} from 'mobx-state-tree'
import {MWithId} from './utils'

const MCast=t.compose('cast',MWithId,t.model({

}))

export default MCast