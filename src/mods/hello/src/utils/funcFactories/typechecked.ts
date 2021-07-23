import { toArray } from '../index'
import { Any as vType } from '../../vTypes/vType.classes'
import { rainbowArray as vRainbowArray } from '../../vTypes/common'

export interface Func<args extends [] = [], result = any> {
  (...args): result
}

interface typecheckedFactory<args extends [] = [], result = any> {
  (func: Func<[], any>): Func<args, result>
}

export const typechecked = <args extends [] = [], result = any>(
  argTypes: vType | vType[],
  resultType?: vType
): typecheckedFactory<args, result> => (func) => {
  const vArgTypes = vRainbowArray(...toArray(argTypes))

  return (...args) => {
    const result = func(...vArgTypes.create(args))
    if (resultType) return resultType.create(result)
  }
}
