import {
  getParent,
  IAnyComplexType,
  IAnyModelType,
  IAnyType,
  IModelType,
  isIdentifierType,
  types,
} from 'mobx-state-tree';
import { mapValues } from 'lodash';
import { addType } from '../registeredTypes';
import {
  ModelActions,
  ModelPropertiesDeclaration,
  ModelPropertiesDeclarationToProperties,
} from 'mobx-state-tree/dist/types/complex-types/model';
import { Instance } from 'mobx-state-tree/dist/internal';

export interface Node {
}

export const WithId = types.model('withid', {
  _id: types.string,
});

export const Meta = types
  .compose(
    'meta',
    WithId,
    types.model({
      _t: types.string,
      _tg: types.array(types.string),
    }),
  )
  .actions((self) => ({
    update(fn) {
      fn(self);
    },
    set(obj) {
      this.$set(obj);
    },
    $set(obj) {
      Object.assign(self, obj);
    },
  }))
  .views(self => ({
    get node() {
      return getParent(self, 2);
    },
  }));

// export function meta2<T extends IModelType<any, any>, T1 extends IModelType<any, any>(fn: (T) => T1) {
//   const comp =
//   const type = fn()
// }

export function meta<T extends IAnyModelType>(name: string, model: T, override = false) {
  const type = types.compose(Meta, model, types.model({ _t: name })).named(name);

  addType(type, override);

  return type;
}

meta(
  'some.meta',
  types
    .model({
      some: types.string,
    })
    .actions((self) => ({
      $doFavor() {
      },

      $runOnServer() {
      },
    })),
);
