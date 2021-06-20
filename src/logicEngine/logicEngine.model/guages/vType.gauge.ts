//TODO: fundamental composition abd fundamentalOarticle types,
import { arrayFlavorProps, tupleFlavorProps, vClass } from '../../types'
import { typeParticleRef } from '../laws/fundamental.vType.law'

export type arrayTypeComposition = vClass<any[], arrayFlavorProps | tupleFlavorProps>
