import React from 'react';
import { Button, List } from 'antd';

import { addComponent } from '../../treenity/context/context-db';
import { ITestLayoutMeta, TestLayoutMeta, TestMeta } from './Test.meta';
import { Instance } from 'mobx-state-tree';
import { Meta } from '../../treenity/meta/meta.model';
import { randomId } from '../../common/random-id';
import { useObserver } from 'mobx-react-lite';

addComponent(TestMeta, 'react', {}, ({ value, onChange }) => {
  const setName = onChange(value => value.set({ name: `newName${randomId()}` }));

  return useObserver(() => <span>
    Im test meta: {value.name}
    <Button onClick={setName} block>Rename</Button>
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
