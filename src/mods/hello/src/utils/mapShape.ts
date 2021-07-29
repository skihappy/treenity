import {reduceShape} from './reduceShape'

interface mapper {
  (prop: any, propName: string): any
}

interface mapShape {
  (shape: object | Map<any, any>, mapper: mapper): {}
}
export const mapShape: mapShape = (shape, mapper) =>
  reduceShape(shape, (prevShape, prop, key) => {
    return typeof shape === 'object'
      ? { ...prevShape, [key]: mapper(prop, key) }
      : (prevShape as Map<any, any>).set(key, prop)
  })
