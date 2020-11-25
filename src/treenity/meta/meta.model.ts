import { isIdentifierType, types } from 'mobx-state-tree';
import { mapValues } from 'lodash';
import { addType } from '../registeredTypes';

export interface Node {}

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

export function meta(name: string, definition: { [field: string]: any }) {
  const actions = {};
  const fields = {
    _t: name,
  };
  for (const name in definition) {
    const val = definition[name];
    if (typeof val === 'function') {
      actions[name] = val;
    } else {
      fields[name] = val;
    }
  }

  const makeActions = (self) => mapValues(actions, (func) => func.bind(self));

  return addType(types.compose(name, Meta, types.model(fields).actions(makeActions)));
}
