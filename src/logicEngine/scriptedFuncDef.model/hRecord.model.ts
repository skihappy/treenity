import { types as t } from 'mobx-state-tree/dist/types'
import { MWithId, tRainbowArray } from '../utils'

const MHRecord = (def) => {
  const MHRecord = t.model(`${def.name}MHRecord`, {
    args: tRainbowArray(
      // @ts-ignore
      ...def.args.map(([argName, typeName], index) => tRainbowArray(argName, def.argType[index]))
    ),
    // @ts-ignore
    result: def.resultType,
  })

  return t.compose(`MHRecord`, MWithId, MHRecord)
}

export default MHRecord
