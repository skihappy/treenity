import { logicElementClass } from '../logicElement.class'
import type { logicEngine, registryRef } from '../types'
import { Union, v } from '../../types'
import { registryRef as vRegistryRef } from '../types'

export const typeLogicElementClass = (logicEngine: logicEngine) => {
  //no composition yet.
  return class extends logicElementClass(logicEngine, 'types', v) {
    // @ts-ignore
    get type(): vClass {
      return this.def
    }
  }
}
