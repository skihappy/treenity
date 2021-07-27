import { mapShape } from './mapShape'

interface customMapper {
  assertion: (value: any) => boolean
  mapper: (value: any) => any
}
export interface mappers {
  object?: (v: object) => any
  array?: (v: any[]) => any
  function?: (v: (...[]) => any) => any
  number?: (v: number) => any
  string?: (v: string) => any
  undefined?: (v: undefined) => any
  null?: (v: null) => any
  bigint?: (v: bigint) => any
  custom?: customMapper[]
}

export interface mappersFactory {
  (map: (struct: any) => any): mappers
}

const defaultMappersFactory: mappersFactory = (map) => ({
  object: (shape) => mapShape(shape, map),
  array: (array) => array.map(map),
  function: (func) => func,
  number: (n) => n,
  string: (s) => s,
  undefined: () => undefined,
  null: () => null,
  bigint: (int) => int,
  custom: [],
})

export const mapStructure = (struct: any, mappersFactory: mappersFactory) => {
  const map = (struct: any) => {
    const customMapper = defaultedMappers.custom.find(({ assertion }) => assertion(struct))
    if (customMapper) return customMapper.mapper(struct)

    if (Array.isArray(struct)) return defaultedMappers.array(struct)
    return defaultedMappers[typeof struct](struct)
  }

  const defaultedMappers = Object.assign(defaultMappersFactory(map), mappersFactory(map)) as Required<mappers>
  return map(struct)
}
