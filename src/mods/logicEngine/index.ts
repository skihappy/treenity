import { IAnyModelType, IAnyType,IModelType,SnapshotOrInstance, Instance,types as t} from 'mobx-state-tree'
import {randomId} from '../../common/random-id'
import {string} from "mobx-state-tree/dist/types/primitives";



//Pin values will be serialized for archiving. Keep it serializable. Use snapshot preprocessors on models if needed
type TPinTypes={[typeName:string]:IAnyType}

interface ILogicEngineSpec  {
    pinTypes:(builtInPinTypes:TPinTypes)=>TPinTypes
}

interface IPinSpec {
    type:string,
    name:string
}

interface IPin extends IPinSpec {
    _id:string,
    type:string,
    name:string,
    block?:string
}

interface IInPin extends IPin {
    side:'in'
    toOutPin?:string
}

interface IOutPin extends IPin {
    side:'out'
    value:any,
    toInPins?:[string],
    isValid:boolean,
    status:string, //reason for invalid value. collect patches for access to history
}

interface ICommonBlock {
    _id:string,
    pins:[IInPin | IOutPin],
}

type TUpdateBlockOutputs=(self:IBaseBlock)=>{[outPinName:string]:any} | void

interface IBaseBlock extends ICommonBlock {
    updateOutputs: TUpdateBlockOutputs
}

interface ICompositeBlock extends ICommonBlock {
    blocks:[IBaseBlock | ICompositeBlock]
}

const MWithId = t.model('withId', {
    _id: t.identifier,
}).actions((self) => ({
    afterCreate: () => {
        self._id = randomId()
    }
}))

const MBlock=t.model({

})

/*
This defines the syntax of logic engine. Its just a start. Anything can be added on later.
 */
interface ICommonBlockSpec {
    inputPins?:[IPinSpec],
    outputPins:[IPinSpec]
}

interface IBaseBlockSpec extends ICommonBlockSpec {
    updateOutputs: TUpdateBlockOutputs
}

interface ICompositeBlockSpec {
    defineBlocks:(self:IAnyModelType)=>void,
    connectBlocks:(self:IAnyModelType)=>void
}

type TBlockSpec=IBaseBlockSpec | ICompositeBlockSpec

interface ILogicEngine {
    block:(blockSpec:TBlockSpec)=>IAnyModelType
}

/*
heres how it works.
In a gist, each block runs as a state machine, triggering actions on state changes. The elogic engine takes care of updating
state of the block. The triggers react to the state changes. Each trigger runs inside an autorun function and many
triggers can run at the same time, within the same autorun,  in specified sequence.

Each block has input and output pins, that can be connected, outputs to inputs in one to many fashion. Output pins have
values, of type specified by pin type. The type is one of registered types. There are a number of builtin types, more
can be added by a hook at logic engine creation. Its advised to keep types serializable.  If not, logic engine will live
entirely on the server and its state will not be restored from database on server restart.  Also, historic data will be
incomplete and time travel will be limited. One good way to control serialization of values is to use snapshotProcecessor
on their models. As example, functions can be stringified and rehydrated inside a vm.

When a value of output  pin is updated by updateOutputs action, the pin is invalidated if changed. A simple '===' test is
sed as default, but a custom isSame predicate hook can be used for each pin.  Invalidated pin does not propagate
to the blocks connected to the output pins. The exact strategy is left to the triggers, thus separating the state machine of
the logic engine from its operational logic, which can change from block to block. However, such propagating behaviour
is encapsulated in transactional trigger. When used ahead any other triggers, the invalidated output value will propagate
downstream and no block will be executed till all input pins are valid again, ensuring integrity of input data and avoiding
partial output updates.

it works recursively thru layers of composed blocks. Somehow, the top block gets triggered and updateOutputs action is
fired. How it gets triggered is determined by setTrigger action. There are several built in triggers, but a custom one can be
specified. Triggers can be composed inside custom trigger function. New triggers can be defined by addTrigger action.
Triggers can be accessed thru triggers prop of block model,  for composition and to dynamically change triggers at runtime.
A sequence of triggers can be specified by setTrigger. All triggers are invoked and results are ANDed. A new trigger can
be specified by a sequence as well, with its own name. This design allows to isolate functionality from block state handling.
The engine takes care of block state. Triggers are the brain connected to the block state machine.

Each block can specify a model of its state. The block state is preserved between executions and can be mutated only
from actions of the block, not from  outside, thus insuring all interactions only ver pin connections. Block state can be
mutated only by setState action. It will update stateHasChanged flag of the block.  The flag is automatically reset before
execution of updateOutputs action. The block state can be used to extend the state machine of the logic engine. Only trigger
functions can observe state of other blocks and react to status changes. The updateOutputs action does not have access to
anything outside of its block,  but does have access to local setState and local state. Again, this insures blocks react only
to changes in inputs and local state.

 */
const logicEngine=(logicEngineSpec:ILogicEngineSpec):ILogicEngine=>{
    const {pinTypes:getPinTypes}=logicEngineSpec

    const builtInPinTypes={
        string:t.string,
        number:t.number,
        integer:t.integer,
        date:t.Date
    }

    const pinTypes=getPinTypes(builtInPinTypes)
    const pinModelsOfType=(typeName:string)=>{
        const MPin=t.compose(`pin<${typeName}>`,MWithId,t.model('',{
            type:typeName,
            name:string,
            block:t.maybe(t.reference(t.late(()=>MBlock)))
        }))
        const MInPin=t.compose(`inputPin<${typeName}>`,  MPin,t.model('',{
            side:'in',
            toOutPin:t.maybe(t.reference(t.late(()=>MOutPin)))
        })).actions((self)=>{
            return {
                connect:(toOutPin:Instance<typeof MOutPin>)=>{
                    self.toOutPin=toOutPin._id
                    toOutPin.connect(self)
                },
                disconnect:()=>{
                    !!self.toOutPin && self.toOutPin.disconnect()
                    delete self.toOutPin
                },
                invalidate:(reason?:string)=>{
                    self.block.invalidate(reason)
                }
            }
        })
        const MOutPin=t.compose(`outputPin<${typeName}>`,  MWithId,t.model('',{
            side:'out',
            value:pinTypes[typeName],
            toInPins:t.maybe(t.array(t.maybe(t.reference(MInPin))))
        }))
        return (side:string):IAnyModelType=>{

            if(side==='in'){
                return
            }
        }
    }
    const pinModels=Object.entries(pinTypes).reduce((acc,[typeName,type])=>{
        return {...acc,[typeName]:t.model()}
    },{})
    const MPin = t.compose('Pin',t.model('',{
        type: t.string,
        name: t.string,
        value:t.late(()=>MPinValue)
    }),MWithId)

    const MCommonBlock=t.model('commonBlock',{

    })
    return {
        block:(blockSpec)=>{
            return MBlock.create({})
        }
    }
}

export default logicEngine

/**************/

export const tInputPin = t.compose('InPin', t.model({
        side: 'in',
    }),
    tPin
  )
  .actions((self) => {
    return {
      init: (value) => {
        if (typeof value !== 'undefined') {
          self.defaultValue = value
        }
        self.value = value
      },
    }
  })

export const tOutputPin = t
  .compose(
    tPin,
    t.model('OutPin', {
      side: 'out',
    })
  )
  .actions((self) => {
    const { name: fromPin, blockName: fromBlock } = self
    return {
      connect: (toPin: Instance<typeof tInputPin>) => {
        const { name: toPinName, blockName: toBlockName } = toPin
        //self.links = [...(self.links || []), tBlockLink.create({ fromPin, fromBlock, toPin, toBlock })]
      },
    }
  })

export const tBlockLink = t
  .model('BlockLink', {
    fromPin: t.reference(tInputPin),
    fromBlock: t.maybe(t.reference(t.late(() => tBlock))),
    toPin: t.reference(tOutputPin),
    toBlock: t.maybe(t.maybe(t.reference(t.late(() => tBlock)))),
    id: t.identifier,
  })
  .actions((self) => {
    return {
      send: () => {},
      afterCreate: setId(self),
    }
  })

export const tBlock = t
  .model('Block', {
    id: t.identifier,
    parentBlock: t.maybe(t.reference(t.late(() => tBlock))),
    input: t.array(tInputPin),
    output: t.array(tOutputPin),
    blocks: t.maybe(t.array(t.late(() => tBlock))),
  })
  .actions((self) => {
    return {
      run: () => {},
      addPin: (props: { type: string; name: string; side: 'input' | 'output' }) => {
        const { side } = props
        const pinModel = side === 'input' ? tInputPin : tOutputPin
        const pin = pinModel.create({ ...props, block: self.id, side })
        self[side] = [...(self[side] || []), pin]
      },
      afterCreate: setId(self),
    }
  })

/*

export const mBlock=meta('block',{
    inputs:types.array(tBlockInput)
})
export type TPort={
    [port:string]:IAnyModelType
}




export interface BlockElement {
    name:string,
``
}

export interface CompositeBlockSpec {
    name?: string
    inputModel?:PortModel,
    outputModel?:PortModel,
    state?:IAnyModelType,
    blocks:
}
export interface BlockFunc {
    (blockSpec:BlockSpec,):
}*/
