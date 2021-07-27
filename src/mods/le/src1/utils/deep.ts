import { LogicError } from './logicError.class'

export const deep = (target: {} | [], path: (string | number)[]) => {
  if (!path.length) return target
  const [propNameOrIndex, ...newPath] = path
  if (typeof target === 'object' || Array.isArray(target)) return deep(target[propNameOrIndex], newPath)
  throw new LogicError(`path ${path} does not exist in target ${target}`)
}
