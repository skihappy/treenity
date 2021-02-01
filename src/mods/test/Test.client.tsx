import React from 'react';
import { List } from 'antd';

import { addComponent } from '../../treenity/context/context-db';
import { ITestLayoutMeta, ITestMeta, TestLayoutMeta, TestMeta } from './Test.meta';
import { getParent, Instance } from 'mobx-state-tree';
import { Meta } from '../../treenity/meta/meta.model';

addComponent(TestMeta, 'react', {}, ({ value }: { value: ITestMeta }) => {
  return <span>Im test meta: {value.name}</span>;
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
