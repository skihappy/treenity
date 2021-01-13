import { types } from 'mobx-state-tree';

export const Link = types.model('link', {
  node: types.maybe(
      types.reference(
          types.late(()=>types.Node)
      )
  ),
  meta: types.maybe(
      types.reference(types.Meta)
  ),
  fieldPath: types.maybe(types.string),
});

export const Edge = types.model('edge', {
  from: Link,
  to: Link,
});
