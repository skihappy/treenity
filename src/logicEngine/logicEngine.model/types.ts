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

export type collectionRef = componentRef | elementRef

const componentProps = Dict(
  {
    propType: any,
  },
  'componentProps'
)

const componentRef = Shape(
  {
    propTypes: {
      name: stringType,
      props: Optional({
        type: componentProps,
        defaultValue: {},
      }),
    },
  },
  'componentRef'
)

export interface collectionRefProps {
  collectionName: string
}

export const collectionRef = createVComponent<collectionRefProps>({
  assertValue: ({ collectionName }) => (ref) => {
    assert(componentRef.is(ref), `bad ${collectionName} registry ref `)
  },
  casts: [
    {
      fromType: stringType,
      cast: (name) => ({ name, props: {} }),
    },
  ],
  createValue: ({ collectionName }) => (ref) => {
    const vRef = Shape({
      propTypes: componentRef.props.propTypes,
      helpers: {
        collectionName: () => collectionName,
      },
    })
  },
  flavor: 'collectionRef',
})
