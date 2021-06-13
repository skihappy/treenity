import {
  arrayFlavorProps,
  dictFlavorProps, jsonFlavorProps,
  maybeFlavorProps,
  optionalFlavorProps, Shape,
  shapeFlavorProps, tupleFlavorProps,
  unionFlavorProps, v,
  vClass,
} from '../../types'

export type fundamentalTransferFlavors = 'array' | 'shape' | 'union'

export interface transforms<particleType> {
  [fromProp:string]:(fromPropValue:any)=>particleType
}

export interface fundamentalTransform<fromType, particleType, flavorProps extends object = object> {
  (fromTypeFlavorProps: flavorProps): (decomposition: fromType) => particleType | undefined
}
export interface fundametntalTransforms<particleType> {
  array?: fundamentalTransform<(particleType | undefined)[], particleType, arrayFlavorProps>
  shape?: fundamentalTransform<{ [key: string]: particleType | undefined }, particleType, shapeFlavorProps>
  dict?: fundamentalTransform<{ [key: string]: particleType | undefined }, particleType, dictFlavorProps>
  union?: fundamentalTransform<particleType | undefined, particleType, unionFlavorProps>
  optional?: fundamentalTransform<particleType | undefined, particleType, optionalFlavorProps>
  maybe?: fundamentalTransform<particleType | undefined, particleType, maybeFlavorProps>
  json?: fundamentalTransform<string, particleType, jsonFlavorProps>
  tuple?: fundamentalTransform<(particleType | undefined)[], particleType, tupleFlavorProps>

}
export interface particleProp<particleType> {
  type: vClass<particleType>
  fundamentalTransforms: fundametntalTransforms<particleType>
  transforms?:transforms<particleType>
}

export const vParticleProp=Shape({
  propTypes:{
    type:v,
    fundamentalTransforms:Dict({
      type:
    })
  }
})
