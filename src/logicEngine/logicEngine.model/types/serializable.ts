import { assert, createV, vClass } from '../../types'
import { IAnyType, isType } from 'mobx-state-tree'

export const serializable = createV<IAnyType>((value) => assert(isType(value), 'not mst type'))
