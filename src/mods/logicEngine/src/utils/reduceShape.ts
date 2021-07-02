interface reducer {
  (target: any, prop: any, key: any): object
}

interface reduceShape {
  (shape: object | Map<any, any>, reducer: reducer, target?: object): object
}

export const reduceShape: reduceShape = (shape, reducer, target = {}) => {
  const reduceEntries = (entries: [key: any, value: any][]) =>
    entries.reduce((target, [key, prop]) => reducer(target, prop, key), target)

  // @ts-ignore
  const entries = typeof shape === 'object' ? Object.entries(shape) : Map.entries(shape)
  return reduceEntries(entries)
}
