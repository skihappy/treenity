/**
 * Created by kriz on 07/04/2018.
 */

import { Card, Layout } from 'antd';
import { Meteor } from 'meteor/meteor';
import React from 'react';
import { NamedNode } from '../../mods/types/named-node/NamedNode.meta';
import { CurrentNodeProvider } from '../../tree/base/CurrentNodeContext';
import MetaContext from '../../tree/context/meta-context';
import { RenderMeta } from '../../tree/ui/render-meta';
import composeWithTracker from '../utils/withTracker';

// import './TreePage.less';

export const WebPageComponent = ({ root, current, currentNode, params, allChildren }) => {
  return (
    <CurrentNodeProvider value={{
      current, setCurrent: () => {
      },
    }}>
      {current ? (
        <MetaContext context="react" name="layout">
          <Layout>
            <RenderMeta {...{ meta: current, node: current, context: 'react' }} />
          </Layout>
        </MetaContext>
      ) : (
        <Card>
          <h3>Not found</h3>
        </Card>
      )}
    </CurrentNodeProvider>
  );
};

export default composeWithTracker((props, onData) => {
  const currentNode = props.params.id || props.currentNode;

  Meteor.subscribe('tree', currentNode);

  const root = NamedNode.getRoot();
  const current = currentNode ? NamedNode.findOne(currentNode) : root;
  // const allChildren = root && root.allChildrenRx();

  if (root) {
    onData({
      node: root,
      root,
      current,
      currentNode,
      // allChildren,
    });
  }
})(WebPageComponent);
