import { mapShape } from './mapShape'

export interface structMappers {
  object?: (v: object) => any
  array?: (v: any[]) => any
  function?: (v: (...[]) => any) => any
  number?: (v: number) => any
  string?: (v: string) => any
  undefined?: (v: undefined) => any
  null?: (v: null) => any
  bigint?: (v: bigint) => any
}

const defaultStructMappers: Required<structMappers> = {
  object: (shape) => mapShape(shape),
}

export const mapStructure = (struct: any, mappers: structMappers) => {
  const mapStructure = (struct: any) => {}
}
