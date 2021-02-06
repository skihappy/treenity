import React from 'react';
import { flatMap } from 'lodash';
import { addComponent } from '../context/context-db';
import { IAnyType, Instance } from 'mobx-state-tree';
import { useObserver } from 'mobx-react-lite';
import { INode, Node } from '../tree/node';
import { RenderMeta } from '../react/render-meta';
import { useServiceFind } from '../react/useServiceFind';
import { SysinitMeta } from './Sysinit.meta';

interface IMetaProps<Meta extends IAnyType> {
  value: Instance<Meta>;
}

function Sysinit({ value }: IMetaProps<typeof SysinitMeta>) {
  const [services] = useServiceFind('tree', { '_m._tg': '~service' });

  const metas = useObserver(() => {
    return flatMap(services, node => node.metas.filter(meta => meta._tg.includes('~service')));
  });

  return metas.map(meta => <RenderMeta key={meta._id} value={meta} />);
}

interface ComponentProps<T> {
  value: Instance<T>;
}

function MetaServiceInit({ value }: ComponentProps<INode>) {
  return value.metas.map(meta => <RenderMeta key={meta._id} value={meta} />);
}

addComponent(Node, 'service', {}, MetaServiceInit);
addComponent(SysinitMeta, 'service', {}, Sysinit);
