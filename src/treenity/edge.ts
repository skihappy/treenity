import { types } from 'mobx-state-tree';

export const Link = types.model('link', {
  nodeId: types.maybe(types.string),
  metaId: types.maybe(types.string),
  field: types.maybe(types.string),
});

export const Edge = types.model('edge', {
  from: Link,
  to: Link,
});
