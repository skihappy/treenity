import { Union } from '../../../types'
import { particleClassLaw } from '../../particle.class'
import { pinLaw } from './pin.law'

export const pinsLaw: particleClassLaw = {
  className: 'pins',
  compositionSpecType: Union({
    types: [pinLaw('input').compositionSpecType, pinLaw('output').compositionSpecType],
  }).dictOf(),
}
