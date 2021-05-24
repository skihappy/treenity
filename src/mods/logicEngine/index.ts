import { IAnyModelType, IAnyType,IModelType,SnapshotOrInstance, Instance,types as t} from 'mobx-state-tree'
import {randomId} from '../../common/random-id'
import {string} from "mobx-state-tree/dist/types/primitives";



//Pin values will be serialized for archiving. Keep it serializable. Use snapshot preprocessors on models if needed
type TValueTypes={[typeName:string]:IAnyType}

//Types are specified by names and should match types specified in valueTypes dict
interface IValueCast {
    fromType:string,
    toType:string,
    cast:(inValue:any)=>any
}

interface ILogicEngineSpec  {
    valueTypes?:(builtInValueTypes:TValueTypes)=>TValueTypes,
    valueCasts?:(builtInCasts:[IValueCast])=>[IValueCast]
}

interface IPinSpec {
    type:string,
    name:string
}

interface IPin extends IPinSpec {
    _id:string,
    block:string
}

type TPinStatus={
    isValid:boolean,
    reason:string //reason for invalid value. collect patches for access to history
}

interface IInPin extends IPin {
    side:'in'
    toOutPin?:string,
    status:Readonly<TPinStatus>

}

interface IOutPin extends IPin {
    side:'out'
    value:any,
    toInPins?:[string],
    status:TPinStatus
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

/*
This defines the syntax of logic engine. Its just a start. Anything can be added on later.
 */
interface ICommonBlockSpec {
    inputPins?:[IPinSpec],
    outputPins:[IPinSpec]
}

interface IBaseBlockSpec extends ICommonBlockSpec {
    updateOutputs: (inputs:{[inPinName:string]:any},state?:IAnyModelType)=>{[outPinName:string]:any}
}

interface ICompositeBlockSpec {
    defineBlocks:(self:IAnyModelType)=>void,
    connectBlocks:(self:IAnyModelType)=>void
}

type TBlockSpec=IBaseBlockSpec | ICompositeBlockSpec

interface ILogicEngine {
    block:(blockSpec:TBlockSpec)=>IAnyModelType
}

const logicEngine=(logicEngineSpec:ILogicEngineSpec):ILogicEngine=>{
    const {valueTypes:getValueTypes}=logicEngineSpec

    const builtInValueTypes={
        string:t.string,
        number:t.number,
        integer:t.integer,
        date:t.Date
    }

    const valueTypes=getValueTypes(builtInValueTypes)

    const pinModelOfType=(typeName:string):(side:'in' | 'out')=>IAnyModelType=>{
        const MPin=t.compose(`pin<${typeName}>`,MWithId,t.model('',{
            type:typeName,
            name:t.string,
            block:t.maybe(t.reference(t.late(()=>MBlock))),
        }))
        const MPinStatus=t.model('pin status',{
            isValid:t.boolean,
            reason:t.maybe(t.string)
        })
        const MInPin=t.compose(`inputPin<${typeName}>`,  MPin,t.model('',{
            side:'in',
            toOutPin:t.maybe(t.reference(t.late(()=>MOutPin)))
        })).actions((self)=>{
            return {
                connect:(toOutPin:Instance<typeof MOutPin>):void=>{
                    self.toOutPin=toOutPin
                    toOutPin.connect(self)
                },
                disconnect:():void=>{
                    !!self.toOutPin && self.toOutPin.disconnect()
                    delete self.toOutPin
                }
            }
        }).view((self)=>{
            const typeName=self.typeName
            const castOutputValue=()=>{

            }

            return {
                get status(){
                    if(!self.toOutPin)return MPinStatus.create({
                        isValid:false,
                        reason:'not connected'
                    })
                    if(!self.toOutPin.status.isValid)return MPinStatus.create({
                        isValid:false,
                        reason:`connected output pin invalid: ${self.toOutPin.status.reason}`
                    })
                    return MPinStatus.create({
                        isValid:true,
                    })
                }
            }
        })

        const MOutPin=t.compose(`outputPin<${typeName}>`,  MWithId,t.model('',{
            side:'out',
            value:valueTypes[typeName],
            toInPins:t.maybe(t.array(t.maybe(t.reference(MInPin)))),
            status:MPinStatus
        })).actions((self)=>{
            const {status}=self
            return {
                setInvalid:(reason?:string)=>{
                    status.isValid=false
                    status.reason=`invalid: ${reason}`
                },
                setValid:()=>{
                    status.isValid=true
                    status.reason=''
                },
                connect:(toInPin:Instance<typeof MInPin>)=>{

                },
                disconnect:()=>{

                },
                setValue:()=>{

                }
            }
        })

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
