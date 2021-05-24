import { logicElementClass } from '../logicElement.class'
import type { logicEngine, registryRef } from '../types'
import { mapShape } from '../../utils'
import { Shape, Dict, serializableType, Literal, Union, stringType, functionType, ArrayType, vClass } from '../../types'
import { registryRef as vRegistryRef } from '../types'
import { filterShape } from '../../utils/filterShape'

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
  }

  const baseBlockSpec = Shape({
    propTypes: {
      ...commonBlockPropTypes,
      executor: functionType,
    },
    helpers: {},
  })

  const vConnections = stringType.dictOf()

  const assertConnections = (vBlockSpec: vClass) => (blockSpec) => {}
  const compositeBlockSpec = Shape({
    propTypes: {
      ...commonBlockPropTypes,
      blocks: vRegistryRef({ registryName: 'blocks' }).dictOf(),
      connections: vConnections,
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
  return class extends logicElementClass(logicEngine, 'blocks', blockSpecType) {
    private findPin(pinName, blockName?) {
      const { blocks, pins } = this.def
      const targetPins = !!blockName ? (blocks[blockName] || {}).pins : pins

      return (pins || {})[pinName]
    }

    private validateConnections() {
      const { connections } = this.spec

      if (!vConnections.is(connections)) return

      const validateConnection = (from, to) => {
        const validateSide = (token) => {
          const tokens = token.split(':')
          this.validate(tokens.length !== 1 && tokens.length !== 2, `connection ${from}->${to}: bad syntax - ${token}`)

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
