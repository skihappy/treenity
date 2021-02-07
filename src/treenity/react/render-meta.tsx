/**
 * Created by kriz on 10/12/16.
 */

import React, { useCallback } from 'react';
import { getType, IAnyType, isStateTreeNode, isType } from 'mobx-state-tree';

import { getTypeContextConfig } from '../context/context-db';
import { useMetaContext } from '../context/meta-context';
import { useApp } from './useApp';
import saveNode from '../tree/save-node';

const getTypeName = (type) => {
  if (isType(type)) return type.name;
  if (isStateTreeNode(type)) return getType(type).name;

  throw new Error('unknown type type');
};

const metaOnChange = (app, value) => (callback, deps = []) => {
  const node = value.node;
  return useCallback(() => saveNode(app, node, () => callback(value)), [
    value,
    callback,
    ...deps,
  ]);
};

interface RenderMetaProps {
  value: any;
  onChange?: (any) => void;
  type?: IAnyType | string;
  context?: string;
  forwardKey?: string;

  props?: any;
}

export const RenderMeta = React.memo(({
  value,
  onChange,
  type,
  context,
  forwardKey,
  props,
}: RenderMetaProps) => {
  const typeName = getTypeName(type || value);

  const app = useApp();
  const change = onChange ?? metaOnChange(app, value);

  const ctx = useMetaContext(context);

  const info = getTypeContextConfig(typeName, ctx);
  if (!info) return null;

  const { component: Component, props: infoProps } = info;

  return Component ? (
    <Component
      {...infoProps}
      value={value}
      type={type}
      onChange={change}
      {...props}
      key={forwardKey}
      context={ctx}
    />
  ) : null;
});

// export const RenderMetaType = ({ type, ...props }) => {
//   const meta = props.node.getMeta(type);
//   return renderMeta({ ...props, meta });
// };
// export const RenderNode = props => (renderMeta({ ...props, meta: props.node }));
//
// export function createActions(actions) {
//   const names = Object.keys(actions);
//   actions.bind = (obj, act) => {
//     const ret = {};
//     names.forEach(n => ret[n] = actions[n].bind(obj));
//     if (act)
//       Object.keys(act).forEach(n => ret[n] = act[n].bind(obj));
//     return ret;
//   };
//   return actions;
// }
