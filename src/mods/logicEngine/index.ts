import { IAnyModelType, SnapshotOrInstance, Instance } from 'mobx-state-tree'
import { meta } from '../../treenity/meta/meta.model'
import { Node } from '../../treenity/tree/node'
import {Edge as tEdge} from '../../treenity/edge'
import {randomId} from '../../common/random-id'
import {registeredTypes as t} from '../../treenity/registeredTypes'

const tWithId = t.model('withId', {
    _id: t.string,
}).actions((self) => ({
    afterCreate: () => {
        self.id = randomId()
    }
}))

const tLink=t.model('Link',)
export const tWithLinks=t.model('withLinks',{

})

export const tPin = t.compose('Pin', tWithId,{
    type: t.string,
    name: t.string,
    block: t.maybe(t.reference(t.late(() => tBlock))),
    edge:t.maybe(t.reference(t.late(() => tEdge)))
})

export const tInputPin = t.compose('InPin', {
      side: 'in',
      link: t.reference(t.late(() => tBlockLink)),
    }),
    tPin
  )
  .actions((self) => {
    return {
      init: (value) => {
        if (typeof value !== 'undefined') {
          self.defaultValue = value
        }
        self.value = value
      },
    }
  })

export const tOutputPin = t
  .compose(
    tPin,
    t.model('OutputPin', {
      side: 'output',
      links: t.array(t.reference(t.late(() => tBlockLink))),
    })
  )
  .actions((self) => {
    const { name: fromPin, blockName: fromBlock } = self
    return {
      connect: (toPin: Instance<typeof tInputPin>) => {
        const { name: toPinName, blockName: toBlockName } = toPin
        self.links = [...(self.links || []), tBlockLink.create({ fromPin, fromBlock, toPin, toBlock })]
      },
    }
  })

export const tBlockLink = t
  .model('BlockLink', {
    fromPin: t.reference(tInputPin),
    fromBlock: t.maybe(t.reference(t.late(() => tBlock))),
    toPin: t.reference(tOutputPin),
    toBlock: t.maybe(t.maybe(t.reference(t.late(() => tBlock)))),
    id: t.identifier,
  })
  .actions((self) => {
    return {
      send: () => {},
      afterCreate: setId(self),
    }
  })

export const tBlock = t
  .model('Block', {
    id: t.identifier,
    parentBlock: t.maybe(t.reference(t.late(() => tBlock))),
    input: t.array(tInputPin),
    output: t.array(tOutputPin),
    blocks: t.maybe(t.array(t.late(() => tBlock))),
  })
  .actions((self) => {
    return {
      run: () => {},
      addPin: (props: { type: string; name: string; side: 'input' | 'output' }) => {
        const { side } = props
        const pinModel = side === 'input' ? tInputPin : tOutputPin
        const pin = pinModel.create({ ...props, block: self.id, side })
        self[side] = [...(self[side] || []), pin]
      },
      afterCreate: setId(self),
    }
  })

/*

export const mBlock=meta('block',{
    inputs:types.array(tBlockInput)
})
export type TPort={
    [port:string]:IAnyModelType
}




export interface BlockElement {
    name:string,
``
}

export interface CompositeBlockSpec {
    name?: string
    inputModel?:PortModel,
    outputModel?:PortModel,
    state?:IAnyModelType,
    blocks:
}
export interface BlockFunc {
    (blockSpec:BlockSpec,):
}*/
