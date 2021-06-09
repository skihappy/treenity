import {
  Shape,
  any,
  createVComponent,
  Dict,
  Optional,
  stringType,
  Union,
  v,
  vClass,
  cast,
  objectType,
  Maybe
} from '../../types'
import { logicEngineModel } from '../index'
import { Instance } from 'mobx-state-tree'
import { assert } from '../../utils'
import { particleClassLaw } from '../particle.class'

export type logicEngine = Instance<typeof logicEngineModel>

//reference to a particle flavor inside particle group collection.
//Note, group name is specified by a particle type, normally used as a placeholder
// in a compositionType of group law. Then, refs to other particles in particle compositions are written
//implicitly.
//
export type particleElementRef= {
  flavor: string
  props: object
} | string


const particleComponentProps = Dict(
  {
    propType: any,
  },
  'particleComponentProps'
)

//if group not specified,  it will  be filled the placeholder of particle type in compositionType, if used inside a particle
//composition. If used in compositionType, group will be defaulted to group name, the compositionType belongs to.
const particleElementRef = Shape(
  {
    propTypes: {
      group:Maybe({type:stringType}),
      flavor: stringType,
      props: Optional({
        type: particleComponentProps,
        defaultValue: {},
      }),
    },
  },
  'particleElementRef'
).cast({
  nonComponentRef:{
    fromType: stringType,
    cast: (name) => ({ name, props: {} }),
  }
})

export interface particle_vComponentProps {
  group: string
}

export const particleComposition=objectType
export const particleCompositionComponent=Shape({
  propTypes:{
    propTypes:
  }
})

export const particle = createVComponent<particle_vComponentProps>({
  assertValue: ({ group }) => (particle) => {
    Union({
      types:[particleElementRef,particleComposition]
    }).assert(particle,`particle of group ${group}`)
  },
  createValue: ({ group }) => (particle) => {
    const vRef = Shape({
      propTypes: componentRef.props.propTypes,
      helpers: {
        collectionName: () => collectionName,
      },
    })
  },
  flavor: 'particle',
})

export interface compositionType_ComponentProps {
  type: vClass<any>
  flavor: string
}

export const CompositionType = createVComponent<compositionType_ComponentProps>({
  assertValue: ({ type: compositionType }) => (composition) => compositionType.assert(composition),
  flavor: 'composition',
  createValue: ({ type }) => (composition) => type.create(composition),
})

export const Element=createVComponent({
  assertValue:
})
