/**
 * Created by kriz on 07/04/2018.
 */

import { Layout } from 'antd';
import React, { useMemo } from 'react';
import { useLocation } from 'react-router';
import { useParams } from 'react-router-dom';
import { getType } from 'mobx-state-tree';

// import { withLogin } from '../../mods/account/withLogin';
import { getTypeContextConfig } from '../../treenity/context/context-db';
import findMap from '../../utils/find-map';
// import { useCurrentNode } from '../../tree/base/CurrentNodeContext'
// import MetaContext from '../../tree/context/meta-context'
// import findMap from '../../utils/find-map'
import App from '../layouts/App';
import { TreeLayout } from '../layouts/tree-layout/TreeLayout';
import useCurrentUser from '../utils/useCurrentUser';

export const DefaultLayout = ({ node, ...props }) => {
  // const location = useLocation();
  // const user = useCurrentUser();
  // return (
  //   <App {...props} location={location} user={user}>
  //     <TreeLayout node={node} />
  //   </App>
  // )
};

function findMetaByContext(metas, context) {
  return findMap(metas, (meta) => {
    const info = getTypeContextConfig(getType(meta), context);
    return (
      info && {
        ...info,
        meta,
      }
    );
  });
}

const NodeLayout = ({ defaultLayout = DefaultLayout, ...props }) => {
  const [, , node] = useCurrentNode();
  const { ctx = '+layout', rootId } = useParams();

  const layoutInfo = useMemo(() => node && findMetaByContext(node.meta(), `+react ${ctx}`), [node]);
  const Layout = layoutInfo ? layoutInfo.component : defaultLayout;

  return <Layout {...props} value={node} node={node} />;
};

export default NodeLayout;
