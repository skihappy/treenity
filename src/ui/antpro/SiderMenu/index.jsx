import 'rc-drawer-menu/assets/index.css';
import React from 'react';
import DrawerMenu from 'rc-drawer-menu';
import SiderMenu from './SiderMenu';
import './index.less';

export default props => {
  const location = useLocation();
  return props.isMobile ? (
    <DrawerMenu
      parent={null}
      level={null}
      iconChild={null}
      open={!props.collapsed}
      onMaskClick={() => {
        props.onCollapse(true);
      }}
      width="256px"
    >
      <SiderMenu
        {...props}
        collapsed={props.isMobile ? false : props.collapsed}
        location={location}
      />
    </DrawerMenu>
  ) : (
    <SiderMenu {...props} location={location} />
  );
};
