import { types } from 'mobx-state-tree';
import { getType } from './registeredTypes';

export const Link = types.model('link', {
  node: types.maybe(types.reference(types.late(() => getType('node')!))),
  meta: types.maybe(types.reference(types.late(() => getType('meta')!))),
  fieldPath: types.maybe(types.string),
});

export const Edge = types.model('edge', {
  from: Link,
  to: Link,
});
