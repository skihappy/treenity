import { Shape, any, createVComponent, Dict, Optional, stringType, Union } from '../types'
import { logicEngineModel } from './index'
import { Instance } from 'mobx-state-tree'
import { assert } from '../utils'

export type logicEngine = Instance<typeof logicEngineModel>

export type elementRef = string

export interface componentRef {
  name: string
  props: object
}

export type registryRef = componentRef | elementRef

const componentProps = Dict('componentProps', {
  propType: any,
})

const componentRef = Shape('componentRef', {
  propTypes: {
    name: stringType,
    props: Optional('', {
      type: componentProps,
      defaultValue: {},
    }),
  },
})

export interface registryRefProps {
  registryName: string
}

export const registryRef = createVComponent<registryRefProps>({
  assertValue: ({ registryName }) => (ref) => {
    assert(componentRef.is(ref), `bad ${registryName} registry ref `)
  },
  casts: [
    {
      fromType: stringType,
      cast: (name) => ({ name, props: {} }),
    },
  ],
  createValue: ({ registryName }) => (ref) => {
    const vRef = Shape('', {
      propTypes: componentRef.props.propTypes,
      helpers: {
        registryName: () => registryName,
      },
    })
  },
  flavor: 'registryRef',
})
