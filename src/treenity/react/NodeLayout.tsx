import React from 'react';
import { Card } from 'antd';
import { addComponent, findTypeContextIndex } from '../context/context-db';
import { Node } from '../tree/node';
import { RenderMeta } from './render-meta';

const NodeMetaList = ({ value }) => {
  return value._m.map((meta) => (
    <Card key={meta._id} size="small" title={meta._t} style={{ width: 300 }}>
      <RenderMeta value={meta} context="react ?list" />
    </Card>
  ));
};

addComponent(Node, 'react layout list', {}, NodeMetaList);

addComponent(Node, 'react layout', {}, ({ value, context }) => {
  const idx = findTypeContextIndex(
    value._m.map((meta) => meta._t),
    context,
  );
  if (idx < 0) return <NodeMetaList value={value} />;

  return <RenderMeta value={value._m[idx]} context={context} />;
});
