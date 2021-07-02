import {particleClass, particleClassLaw} from '../particle.class'
import type { logicEngine, collectionRef } from '../types/particle.types'
import { mapShape,assert } from '../../utils'
import {
    Shape,
    Dict,
    serializableType,
    Literal,
    Union,
    stringType,
    functionType,
    ArrayType,
    vClass,
    assertValue,
    Tuple
} from '../../types'
import type {selfishHelper} from "../../types";
import { collectionRef as vCollectionRef } from '../types/particle.types'
import { filterShape } from '../../utils/filterShape'

const blockLaw:particleClassLaw={
    className:'blocks',
    compositionSpecType:
}

type connectionSpec=[fromAddress:string,toAddress:string]

export const blockLogicElementClass = (logicEngine: logicEngine) => {
    const pinSpec = (side: 'input' | 'output') =>
        Shape(
            {
                propTypes: {
                    type: vRegistryRef({ registryName: 'serializableTypes' }),
                    side: Literal({ value: side }),
                },
            },
            `${side} pin`
        )

    const pinSpecs = Union({
        types: [pinSpec('input'), pinSpec('output')],
    }).dictOf()

    const commonBlockPropTypes = {
        pins: pinSpecs.defaultsTo({}),
        trigger: vRegistryRef({ registryName: 'blockTriggers' }),
        triggerToInputPinMap: Dict({
            propType: stringType,
        }).defaultsTo({}),
        state:Dict({propType:vRegistryRef({registryName:'types'})})
    }

    interface blockState {
        [key:string]:any
    }
    interface outputPinValues {
        [pinName:string]:any
    }
    const baseBlockSpecType = Shape({
        propTypes: {
            ...commonBlockPropTypes,
            executor: functionType,
        },
        helpers: {
            execute:():()=>=>
},
})

    const connectionSpecType=Tuple({elementTypes:[stringType,stringType]}).refined(
        ()=>([fromAddress,toAddress]:connectionSpec)=>{
            const assertAddress=(address)=>assert(address.split(':')===2,'bad connection address')
            assertAddress(fromAddress)
            assertAddress((toAddress))
        }
    )


    const connectionsSpecType = stringType.dictOf()

    const assertConnections = (vBlockSpec: vClass) => (blockSpec) => {}
    const compositeBlockSpec = Shape({
        propTypes: {
            ...commonBlockPropTypes,
            blocks: vRegistryRef({ registryName: 'blocks' }).dictOf(),
            connections: ArrayType({elementType:connectionSpecType}),
        },
    })
    /*
    const blockSpecType = Union({
      types: [baseBlockSpec, compositeBlockSpec],
    }).refined((vBlockSpec) => (blockSpec) => {
      const { pins, triggerToInputPinMap } = blockSpec

      const errorMessages = Object.entries(triggerToInputPinMap)
        .reduce(messages,([triggerPinName, inputPinName]) => {
          if (!pins[inputPinName as string])
            return `triggerPinMap; block pin ${inputPinName} assigned to trigger pin ${triggerPinName} does not exist`
          if(pins[inputPinName as string].side === 'input')
            ? ``
            : `triggerPinMap; block pin ${inputPinName} assigned to trigger pin ${triggerPinName} is not input`
        },[])
        .filter((msg) => !!msg)

      vBlockSpec.assert(!errorMessages.length, errorMessages)
    })
  */
    return class extends particleClass(logicEngine, 'blocks', blockSpecType) {
        private findPin(pinName, blockName?) {
            const { blocks, pins } = this.def
            const targetPins = !!blockName ? (blocks[blockName] || {}).pins : pins

            return (pins || {})[pinName]
        }

        private validateConnections() {
            const { connections } = this.spec

            if (!vConnections.is(connections)) return

            const validateConnection = (from, to) => {
                const validateAddress = (address) => {
                    const [blockName,pinName] = address.split(':')

                    const block=!blockName || blockName==='self'?this.def:

                    if (tokens.length == 1) {
                        const [pinName] = tokens
                        this.validate(this.findPin(pinName), `connection ${from}->${to}: cant find pin ${pinName}`)
                    } else {
                        const [blockName, pinName] = tokens
                        this.validate(
                            this.findPin(pinName, blockName),
                            `connection ${from}->${to}: cant find pin ${blockName}:${pinName}`
                        )
                    }
                }

                validateSide(from)
                validateSide(to)
            }

            mapShape(connections, validateConnection)
        }
    }
}
