import { logicElementClass } from '../logicElement.class'
import type { logicEngine } from '../types'
import { serializableType, vClass, serializableComponentProps } from '../../types'

export const serializableTypeLogicElementClass = (logicEngine: logicEngine) => {
  const registryName = 'serializableTypes'
  return class extends logicElementClass(logicEngine, registryName, serializableType) {
    // @ts-ignore
    get type(): vClass {
      return this.def
    }

    // @ts-ignore
    get mstType() {
      return (this.type.props as serializableComponentProps).mstType
    }
  }
}
