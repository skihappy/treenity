import { Dict, stringType, Tuple } from '../../../types'
import { assert, mapShape } from '../../../utils'
import { particleClassLaw } from '../../particle.class'

export type pinAddress = [block: string, pin: string]
const assertPinAddress = (address: pinAddress) => assert(address.split(':') === 2, 'bad connection address')

export const blockConnectionsLaw: particleClassLaw = {
  className: 'blockConnections',
  compositionSpecType: Dict({ propType: stringType }).refined((connectionSpec) => {
    Object.entries(connectionSpec).forEach(() => ([from, to]: pinAddress) => {
      assertPinAddress(from)
      assertPinAddress(to)
    })
  }),
}
