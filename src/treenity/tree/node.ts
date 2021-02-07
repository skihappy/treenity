import { meta, Meta } from '../meta/meta.model';
import { addType, registeredTypes, t } from '../';
import { getEnv, getSnapshot, IAnyType, Instance, isStateTreeNode } from 'mobx-state-tree';
import { Edge, Link } from '../edge';
import config from '../../config-common';
import { randomId } from '../../common/random-id';

export const Timestamp = addType(
  t
    .model('timestamp', {
      createdAt: t.optional(t.Date, () => new Date()),
      updatedAt: t.optional(t.Date, () => new Date()),
    })
    .actions((self) => ({
      setUpdatedAt() {
        self.updatedAt = new Date();
      },
    })),
);

function dispatcher(snap: any): IAnyType {
  if (snap._t) {
    const type = registeredTypes[snap._t];
    if (type) return type;
  }

  throw new Error(`type not found: '${snap._t}'`);
}

// fake type to create right meta type by its type-string
const UnionMeta = Meta.named('union-meta');
// @ts-ignore
UnionMeta.isAssignableFrom = function (snap) {
  return true;
};

const NodeModel = meta(
  'node',
  t.compose(
    Timestamp,
    t.model({
      name: t.string,
      _p: t.string,
      _pa: t.array(t.string),
      _r: t.optional(t.number, 0),
      _m: t.array(t.union({ dispatcher }, UnionMeta)),
    })
      .views(self => ({
        get metas() {
          return self._m;
        },
      })),
  ),
);

export const Node = addType(
  NodeModel.actions((self) => ({
    $addMetaSnapshot(metaSnapshot) {
      self._m.push(metaSnapshot);
    },
    $removeMetaId(_id: string) {
      const idx = self._m.findIndex((m) => m._id === _id);
      if (idx >= 0) {
        self._m.splice(idx, 1);
        return true;
      }

      return false;
    },

    $createEdge(to: Instance<typeof Link>) {
      if (config.isServer) {
        const edge = Edge.create({
          from: Link.create({ node: self._id }),
          to,
        });
        // Edges.create(edge);
      }
    },
    $createChild(name: string) {
      const node = Node.create({
        _id: randomId(),
        _p: self._id,
        _pa: [...self._pa, self._id],
        name,
      });
      getEnv(self).app.service('tree').create(node);
    },
  })).actions((self) => ({
    // addMeta: untrack((meta) => {
    //   self._addMeta(getSnapshot(meta));
    // }),
    addMeta(meta) {
      const snapshot = isStateTreeNode(meta) ? getSnapshot(meta) : meta;
      return self.$addMetaSnapshot(snapshot);
    },

    removeMeta(idOrMeta: string | IAnyType) {
      // overloading
      if (isStateTreeNode(idOrMeta)) {
        // @ts-ignore
        idOrMeta = (idOrMeta as Instance<typeof Meta>)._id;
      }
      return self.$removeMetaId(idOrMeta as string);
    },
    createChild(name: string) {
      return self.$createChild(name);
    },
  })),
  true,
);


export type INode = Instance<typeof Node>;
