import React from 'react';
import { Button } from 'antd';
import { Meta, addComponent } from '../../tree';
import addToolbarMenu from '../../tree/ui/create-meta/addToolbarMenu';
import MetaEdit from '../../mods/types/meta/MetaEdit';

const TestErrorMeta = Meta.inherit({
  name: 'test.error',
  fields: {
    error: String,
  },
});

const TestErrorComponent = ({ meta }) => {
  throw new Error(meta.error);
  return (
    <Button
      onClick={() => {
        throw new Error(meta.error);
      }}
    >
      Throw error
    </Button>
  );
};

addComponent(TestErrorComponent, TestErrorMeta, 'react');
addComponent(MetaEdit, TestErrorMeta, 'react edit');
addToolbarMenu(TestErrorMeta, 'test/ui', 'UI Error', meta => meta.set({ error: 'Test Error' }));
