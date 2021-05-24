import { warn } from 'winston'
import { types as t } from 'mobx-state-tree'

export interface iEvent {
  name: string
  data: any
  [key: string]: any
}

export const tEvent
if (!window) {
  const EventEmitter = require('events')
  module.exports.port = class extends EventEmitter {
    on(eName, listener) {
      //@ts-ignore
      super(eName, (e) => listener(Object.assign(e, { name: eName })))
    }
    static subport(config: (iEvent) => iEvent) {
      return class extends this {
        on(eName, listener) {
          //@ts-ignore
          super(eName, (e) => {
            listener(config(e))
          })
        }
      }
    }
  }
}
