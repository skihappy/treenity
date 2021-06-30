import { reduceShape } from './reduceShape'

export const filterShape = (shape: object, predicate: (prop: any, propName: string) => boolean) => {
  const mapper = (filteredShape, prop, propName) => {
    return predicate(prop, propName) ? { ...filteredShape, [propName]: prop } : filteredShape
  }

  return reduceShape(shape, mapper, {})
}
