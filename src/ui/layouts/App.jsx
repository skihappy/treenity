import { ApiOutlined, CopyrightOutlined, GithubOutlined } from '@ant-design/icons';
import { Layout } from 'antd';

import React from 'react';

import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { useNavigate } from 'react-router-dom';
import GlobalFooter from '../antpro/GlobalFooter';
import GlobalHeader from '../antpro/GlobalHeader/index';

import SiderMenu from '../antpro/SiderMenu/SiderMenu';
import { PortalHandler } from '../helpers/Portal';
import { useBoolean } from '../utils/useBoolean';

const CONNECTION_ISSUE_TIMEOUT = 5000;

const isMobile = false;
const menuData = [
  {
    name: 'Tree',
    icon: <ApiOutlined />,
    path: '/t',
  },
];

function App(props) {
  // const [showConnectionIssue, toggleShowConnectionIssue] = useState(false);
  const [menuCollapsed, toggleMenu] = useBoolean(false);

  const closeMenu = () => toggleMenu(true);

  const navigate = useNavigate();
  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      navigate('/logout');
    }
  };

  const { user, children, location } = props;

  const currentUser = user && {
    name: user.emails[0].address,
    avatar:
      'https://thumbs.dreamstime.com/b/vector-icon-user-avatar-web-site-mobile-app-man-face-flat-style-social-network-profile-45837377.jpg',
    notifyCount: 0,
  };

  return (
    <Layout>
      <SiderMenu
        title="Treenity"
        logo="/assets/logo/treenity.svg"
        Authorized={true}
        menuData={menuData}
        collapsed={menuCollapsed}
        isMobile={isMobile}
        onCollapse={closeMenu}
        width={250}
        location={location}
      >
        <PortalHandler name="sidebar" />
      </SiderMenu>
      <Layout>
        <GlobalHeader
          logo="/assets/logo/logo-square.png"
          currentUser={currentUser}
          // fetchingNotices={fetchingNotices}
          // notices={notices}
          collapsed={menuCollapsed}
          isMobile={isMobile}
          // onNoticeClear={this.handleNoticeClear}
          onCollapse={toggleMenu}
          onMenuClick={handleMenuClick}
          // onNoticeVisibleChange={this.handleNoticeVisibleChange}
        >
          <PortalHandler name="toolbar" />
        </GlobalHeader>
        <Layout.Content style={{ height: '100%' }}>{children}</Layout.Content>
        <GlobalFooter
          links={[
            {
              key: 'Treenity',
              title: 'Treenity',
              href: 'https://treenity.pro',
              blankTarget: true,
            },
            {
              key: 'github',
              title: <GithubOutlined />,
              href: 'https://github.com/treeactor/treenity',
              blankTarget: true,
            },
          ]}
          copyright={
            <div>
              Copyright <CopyrightOutlined /> 2020 Treenity
            </div>
          }
        />
      </Layout>
    </Layout>
  );
}

function AppDnd(props) {
  return (
    <DndProvider backend={HTML5Backend}>
      <App {...props} />
    </DndProvider>
  );
}

export default AppDnd;
