import React from 'react';
import { Button, List } from 'antd';

import { addComponent } from '../../treenity/context/context-db';
import { ITestLayoutMeta, ITestMeta, TestLayoutMeta, TestMeta } from './Test.meta';
import { getParent, Instance } from 'mobx-state-tree';
import { Meta } from '../../treenity/meta/meta.model';
import { randomId } from '../../common/random-id';
import { getActions } from '../../mst/get-actions';
import { useApp } from '../../treenity/react/useApp';
import { useObserver } from 'mobx-react-lite';

addComponent(TestMeta, 'react', {}, ({ value }: { value: ITestMeta }) => {
  const app = useApp();

  let rename = () => {
    const node = value.node;
    const actions = getActions(node, node => {
      value.set({ name: `newName${randomId()}` });
      // value.createChild(name + randomId());
    });
    app.service('tree').patch(node._id, actions, {});
  };
  return useObserver(() => <span>
    Im test meta: {value.name}
    <Button onClick={rename}>Rename</Button>
  </span>);
});

addComponent(TestLayoutMeta, 'react layout', {}, ({ value }: { value: ITestLayoutMeta }) => {
  const metas: Instance<typeof Meta>[] = value.node._m.filter(meta => meta._id !== value._id);
  return <List
    bordered
    dataSource={metas}
    renderItem={meta => (
      <List.Item>{meta._t}</List.Item>
    )}
  />;
});
