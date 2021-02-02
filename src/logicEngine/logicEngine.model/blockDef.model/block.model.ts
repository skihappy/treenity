import { types as t } from 'mobx-state-tree'
import { modelWithID, tRainbowArray } from '../../utils'

export interface IBlockSpec {}

export default (logicEngine) => {
  return modelWithID('MBlock', {})
}
