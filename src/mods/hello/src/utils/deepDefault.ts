import { mapShape } from './mapShape'
import { assert, typeOf } from './index'

//handles anything but map. Goes as deepPick as default goes.  Throws on type mismatch
export const deepDefault = (value, defaultValue, errMessage: string = '') => {
  const defaulted = (value, defaultValue, path: string[] = []) => {
    const deepErrMessage = (valueType: string, defaultType: string) => [
      errMessage,
      `path=${path.join('/')}`,
      `bad default type ${defaultType} for target type ${valueType}`,
    ]

    if (typeof defaultValue === 'object') {
      assert(typeof value === 'object', deepErrMessage(typeOf(value), 'object'))
      return mapShape(defaultValue as object, (defaultProp, propName) =>
        propName in value ? defaulted(value[propName], defaultValue, [...path, propName]) : defaultProp
      )
    }

    if (Array.isArray(defaultValue)) {
      assert(Array.isArray(value), deepErrMessage(typeOf(value), 'array'))
      const lengh = (arr) => (arr as []).length
      const extendedValueArray =
        lengh(value) > lengh(defaultValue) ? [...value, ...Array(lengh(value) - lengh(defaultValue))] : [...value]

      return defaultValue.forEach((defaultElement, index) =>
        !!defaultElement && !extendedValueArray[index]
          ? defaulted(defaultElement, defaultValue, [...path, `${index}`])
          : extendedValueArray[index]
      )
    }

    return !!value ? value : defaultValue
  }

  return defaulted(value, defaultValue)
}
