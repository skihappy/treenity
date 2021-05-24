import { mapShape } from './mapShape'

export const cloneShape = (shape: {}): {} => mapShape(shape, (prop) => prop)
