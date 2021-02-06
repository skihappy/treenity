import React from 'react';
import { Button, Card } from 'antd';
import { addComponent, findTypeContextIndex } from '../context/context-db';
import { INode, Node } from '../tree/node';
import { RenderMeta } from './render-meta';
import { useApp } from './useApp';
import { randomId } from '../../common/random-id';
import { getActions } from '../../mst/get-actions';

const NodeMetaList = ({ value }: { value: INode }) => {
  const app = useApp();

  function createChild(name) {
    const actions = getActions(value, value => {
      value.createChild(name + randomId());
    });
    app.service('tree').patch(value._id, actions, {});
  }

  return value._m.map((meta) => (
    <Card key={meta._id} size="small" title={meta._t} style={{ width: 300 }}>
      <Button onClick={() => createChild('test!!!')}>Create child</Button>
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
