/**
 * Created by kriz on 20/04/2019.
 */

import { omit } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { Button, Drawer } from 'antd';
import { useHotkeys } from 'react-hotkeys-hook';
import { useBoolean } from '../utils/useBoolean';

const withOmitProps = (Component, ...omitProps) => props => (
  <Component {...omit(props, ...omitProps)} />
);

const DrawerButton = styled(withOmitProps(Button, 'visible', 'width'))`
  transform: rotate(-90deg);
  right: ${p => (p.visible ? p.width : 0) - 36}px;
  top: 400px;
  position: absolute;
`;

const RightDrawer = ({ title, children, width = 260 }) => {
  const [visible, toggleVisible] = useBoolean(false);
  useHotkeys('cmd+\',ctrl+\'', toggleVisible);
  const handler = (
    <div>
      <DrawerButton visible={visible} width={width} type="primary" onClick={toggleVisible}>
        {title}
      </DrawerButton>
    </div>
  );

  return (
    <>
      <Drawer
        title={title}
        handler={handler}
        mask={false}
        maskClosable={false}
        visible={visible}
        onClose={toggleVisible}
        width={width}
      >
        {/*<List >*/}
        {/*<List.Item>*/}
        {/*<List.Item.Meta title="Test 1" />*/}
        {/*Test*/}
        {/*</List.Item>*/}
        {/*<List.Item>*/}
        {/*/!*<List.Item.Meta title="Test 2" description="Some.Meta.Type" />*!/*/}
        {/*<Card>Test</Card>*/}
        {/*</List.Item>*/}
        {/*</List>*/}
        {visible && children()}
      </Drawer>
    </>
  );
};

export default RightDrawer;
