import React, { createContext, useCallback, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Instance } from 'mobx-state-tree';
import { useObserver } from 'mobx-react-lite';

import { Context } from '../context/meta-context';
import { RenderMeta } from './render-meta';
import { Node } from '../tree/node';
import { useServiceFind } from './useServiceFind';

interface ICurrentNodeContext {
  current: Instance<typeof Node>;
  setCurrent: (node: Instance<typeof Node>) => void;
  setCurrentId: (string) => void;
}

const CurrentNodeContext = createContext<ICurrentNodeContext>(
  (null as unknown) as ICurrentNodeContext,
);
export const useCurrent = () => useContext(CurrentNodeContext);

export function RenderCurrent({ context = 'layout ?root' }) {
  const { context: ctx = context, rootId = 'root', id = 'root' } = useParams();

  const navigate = useNavigate();
  const setCurrentId = useCallback((id: string) => {
    navigate(`../${id}`);
  }, []);
  const setCurrent = useCallback((node) => {
    setCurrentId(node._id);
  }, []);

  const prevRef = useRef([null, null]);

  const [nodes] = useServiceFind('tree', { _id: { $in: [rootId, id] } });
  const [root = prevRef.current[0], current = prevRef.current[1]] = useObserver(() => [
    nodes.find((n) => n._id === rootId),
    nodes.find((n) => n._id === id),
  ]);

  if (!root || !current) return <span>404</span>;

  prevRef.current = [root, current];

  return (
    <CurrentNodeContext.Provider value={{ current, setCurrent, setCurrentId }}>
      <Context value="!react">
        <RenderMeta value={root} context={ctx} />
      </Context>
    </CurrentNodeContext.Provider>
  );
}
