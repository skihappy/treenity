import { IAnyModelType } from 'mobx-state-tree';

export const registeredTypes: { [type: string]: IAnyModelType } = {};

export function addType<T extends IAnyModelType>(type: T, override: boolean = false): T {
  if (!override && registeredTypes[type.name]) {
    console.warn('Type', type.name, 'already added');
  } else {
    registeredTypes[type.name] = type;
  }
  return type;
}

export function getType(name: string): IAnyModelType | undefined {
  return registeredTypes[name];
}
