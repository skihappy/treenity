import { mapShape } from './mapShape'
import { assert, typeOf } from './index'

//handles anything but map. Goes as deepPick as default goes.  Throws on type mismatch
export const deepTransform = (transform: (value, transformer) => any) => (
  value,
  transformer,
  errMessage: string = ''
) => {
  const transformed = (value, transformer, path: string[] = []) => {
    const deepErrMessage = (valueType: string, transformType: string) => [
      errMessage,
      `path=${path.join('/')}`,
      `bad transform type ${transformType} for target type ${valueType}`,
    ]

    if (typeof transformer === 'object') {
      assert(typeof value === 'object', deepErrMessage(typeOf(value), 'object'))
      return mapShape(transformer as object, (defaultProp, propName) =>
        propName in value ? transformed(value[propName], transformer, [...path, propName]) : defaultProp
      )
    }

    if (Array.isArray(transformer)) {
      assert(Array.isArray(value), deepErrMessage(typeOf(value), 'array'))
      const lengh = (arr) => (arr as []).length
      const extendedValueArray =
        lengh(value) > lengh(transformer) ? [...value, ...Array(lengh(value) - lengh(transformer))] : [...value]

      return transformer.forEach((transformerElement, index) =>
        transformed(transformerElement, extendedValueArray[index], [...path, `${index}`])
      )
    }

    return transform(value, transformer)
  }

  return transformed(value, transformer)
}

export const deepDefault = deepTransform((value, defaultValue) => {
  return !!value ? value : defaultValue
})

export const deepExtend = deepTransform((value, extender) => extender)
