import { IAnyModelType } from 'mobx-state-tree';

export const registeredTypes: { [type: string]: IAnyModelType } = {};

export function addType<T extends IAnyModelType>(type: T): T {
  return (registeredTypes[type.name] = type);
}

export function getType(name: string): IAnyModelType | undefined {
  return registeredTypes[name];
}
