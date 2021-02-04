import { useEffect, useRef, useState } from 'react';
import { applyPatch, applySnapshot, types, unprotect as _unprotect } from 'mobx-state-tree';
import { Node } from '../tree/node';
import { useApp } from './useApp';

const unprotect = (mst) => (_unprotect(mst), mst);

export function useServiceFind(name, query) {
  const q = JSON.stringify(query);
  const [nodes] = useState(() => unprotect(types.array(Node).create()));
  const subIdRef = useRef<string | null>(null);
  const app = useApp();

  useEffect(() => {
    const service = app.service(name);

    const created = (obj) => {
      if (nodes.findIndex(node => node._id === obj._p) >= 0) {
        nodes.push(obj);
        console.log('created', obj);
      }
    };
    const removed = (id) => {
      console.log('removed', id);
      const idx = nodes.findIndex((d) => d._id === id);
      if (idx >= 0) {
        nodes.splice(idx, 1);
      }
    };
    const updated = (obj) => {
      console.log('updated', obj._id);
      const idx = nodes.findIndex((d) => d._id === obj._id);
      if (idx >= 0) {
        applySnapshot(nodes[idx], obj);
      }
    };

    const patched = (arg) => {
      try {
        if (!arg) return;
        const { id, patch, r, ...rest } = arg;

        const idx = nodes.findIndex((d) => d._id === id);
        if (idx < 0) return;

        console.log('patched', id, patch, r, rest);
        const node = nodes[idx];
        applyPatch(node, patch);
        applyPatch(node, { path: '/_r', op: 'replace', value: r });
      } catch (err) {
        console.error(err);
      }
    };
    service.on('created', created);
    service.on('patched', patched);
    service.on('removed', removed);
    service.on('updated', updated);

    service.find({ query: { ...query, subscribe: true } }).then(({ data, subId }) => {
      nodes.splice(0, nodes.length, ...data); // clear array
      subIdRef.current = subId;
      // nodes.push(...data);
    });

    return () => {
      service.removeListener('created', created);
      service.removeListener('patched', patched);
      service.removeListener('removed', removed);
      service.removeListener('updated', updated);
      service.find({ query: { subscribe: false, subId: subIdRef.current } });
      subIdRef.current = null;
    };
  }, [name, q]);

  const find = async (query) => {
    const service = app.service(name);
    const { data } = await service.find({ query: { ...query, subId: subIdRef.current } });
    nodes.push(...data);
  };

  return [nodes, find];
}
