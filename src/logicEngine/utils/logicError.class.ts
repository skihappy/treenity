import { toArray } from './index'

export class LogicError extends Error {
  messages: string[]

  constructor(message: string | string[], parentError?: LogicError | Error) {
    const messageArr = toArray(message).filter((message) => !!message)

    const messages = (() => {
      if (!parentError) return [messageArr]
      return parentError instanceof LogicError
        ? [...messageArr, ...(parentError as LogicError).messages]
        : [...messageArr, (parentError as Error).message]
    })()

    super(messages.join('/n'))
    this.messages = messages
  }
}
