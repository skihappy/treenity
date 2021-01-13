import { IAnyModelType, IAnyType, IModelType, isIdentifierType, types } from 'mobx-state-tree';
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

export const Link = types.model('link', {});

export const Meta = types
  .compose(
    'meta',
    WithId,
    types.model({
      _tg: types.array(types.string),
      _l: types.array(Link),
    })
  )
  .actions((self) => ({
    update(fn) {
      fn(self);
    },
    set(obj) {
      Object.assign(self, obj);
    },
  }));

// export function meta2<T extends IModelType<any, any>, T1 extends IModelType<any, any>(fn: (T) => T1) {
//   const comp =
//   const type = fn()
// }

export function meta<P extends ModelPropertiesDeclaration, A extends ModelActions>(
  name: string,
  props: P,
  actions: (self: Instance<IModelType<ModelPropertiesDeclarationToProperties<P>, any>>) => A,
): IModelType<ModelPropertiesDeclarationToProperties<P>, A> {
  const type = types.compose(name, Meta, types.model(props).actions(actions), types.model({ _t: name }));

  return addType(type);
}

meta(
  types
    .model('some.meta', {
      some: types.string,
    })
    .actions((self) => ({
      $doFavor() {
      },

      $runOnServer() {
      },
    })),
);
