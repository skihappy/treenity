import { Shape, any, createVComponent, Dict, Optional, stringType, Union, v, vClass, cast } from '../types'
import { logicEngineModel } from './index'
import { Instance } from 'mobx-state-tree'
import { assert } from '../utils'
import { particleClassLaw } from './particle.class'

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

export const typeLaw: particleClassLaw = {
  flavor: 'types',

  composition: {
    type: Union({
      types: [
        v,
        collectionRef({
          collectionName: 'types',
        }),
      ],
    }),
  },

  decomposition: {
    particleProps: {
      type: ({ decomposition }) => decomposition,
    },
  },
}

export interface compositionType_ComponentProps {
  type: vClass<any>
  flavor: string
}
export const CompositionType = createVComponent<compositionType_ComponentProps>({
  assertValue: ({ type: compositionType }) => (composition) => compositionType.assert(composition),
  flavor: 'composition',
  createValue: ({ type }) => (composition) => type.create(composition),
})
