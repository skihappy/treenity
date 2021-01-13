import {
  CloseCircleOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Avatar, Divider, Dropdown, Layout, Menu, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';
import groupBy from 'lodash/groupBy';
import React, { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import HeaderSearch from '../HeaderSearch';
import NoticeIcon from '../NoticeIcon';
import './index.less';

const { Header } = Layout;

export default class GlobalHeader extends PureComponent {
  constructor(props) {
    super(props);

    this.triggerResizeEvent = debounce(this.triggerResizeEvent, 600);
  }

  componentWillUnmount() {
    if (this.triggerResizeEvent.cancel) this.triggerResizeEvent.cancel();
  }

  getNoticeData() {
    const { notices = [] } = this.props;
    if (notices.length === 0) {
      return {};
    }
    const newNotices = notices.map(notice => {
      const newNotice = { ...notice };
      if (newNotice.datetime) {
        newNotice.datetime = dayjs(notice.datetime).fromNow();
      }
      // transform id to item key
      if (newNotice.id) {
        newNotice.key = newNotice.id;
      }
      if (newNotice.extra && newNotice.status) {
        const color = {
          todo: '',
          processing: 'blue',
          urgent: 'red',
          doing: 'gold',
        }[newNotice.status];
        newNotice.extra = (
          <Tag color={color} style={{ marginRight: 0 }}>
            {newNotice.extra}
          </Tag>
        );
      }
      return newNotice;
    });
    return groupBy(newNotices, 'type');
  }

  toggle = () => {
    const { collapsed, onCollapse } = this.props;
    onCollapse(!collapsed);
    this.triggerResizeEvent();
  };
  // @Debounce(600)
  triggerResizeEvent = () => {
    // eslint-disable-line
    const event = document.createEvent('HTMLEvents');
    event.initEvent('resize', true, false);
    window.dispatchEvent(event);
  };

  render() {
    const {
      currentUser,
      collapsed,
      fetchingNotices,
      isMobile,
      logo,
      onNoticeVisibleChange,
      onMenuClick,
      onNoticeClear,
      children,
    } = this.props;
    const menu = (
      <Menu className="menu" selectedKeys={[]} onClick={onMenuClick}>
        <Menu.Item disabled>
          <SettingOutlined /> Profile
        </Menu.Item>
        <Menu.Item key="triggerError">
          <CloseCircleOutlined /> Cancel
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item key="logout">
          <LogoutOutlined /> Logout
        </Menu.Item>
      </Menu>
    );
    const noticeData = this.getNoticeData();
    return (
      <div className="global-header">
        <Header className="header">
          {isMobile && [
            <Link to="/" className="logo" key="logo">
              <img src={logo} alt="logo" width="32" />
            </Link>,
            <Divider type="vertical" key="line" />,
          ]}
          {collapsed ? (
            <MenuUnfoldOutlined
              className="trigger"
              style={{ fontSize: 20, margin: 8 }}
              onClick={this.toggle}
            />
          ) : (
            <MenuFoldOutlined
              className="trigger"
              style={{ fontSize: 20, margin: 8 }}
              onClick={this.toggle}
            />
          )}
          {children}
          {currentUser ? (
            <div className="right">
              <HeaderSearch
                className="action search"
                placeholder="Search"
                options={[]}
                onSearch={value => {
                  console.log('input', value); // eslint-disable-line
                }}
              />
              <NoticeIcon
                className="action"
                count={currentUser.notifyCount}
                onItemClick={(item, tabProps) => {
                  console.log(item, tabProps); // eslint-disable-line
                }}
                onClear={onNoticeClear}
                onPopupVisibleChange={onNoticeVisibleChange}
                loading={fetchingNotices}
                popupAlign={{ offset: [20, -16] }}
              >
                <NoticeIcon.Tab
                  list={noticeData['pool']}
                  title="All"
                  emptyText="No messages"
                  emptyImage="https://gw.alipayobjects.com/zos/rmsportal/sAuJeJzSKbUmHfBQRzmZ.svg"
                />
                <NoticeIcon.Tab
                  list={noticeData['personal']}
                  title="Personal"
                  emptyText="No messages"
                  emptyImage="https://gw.alipayobjects.com/zos/rmsportal/HsIsxMZiWKrNUavQUXqx.svg"
                />
              </NoticeIcon>
              {currentUser.name ? (
                <Dropdown overlay={menu}>
                  <span className={`${'action'} ${'account'}`}>
                    <Avatar size="small" className="avatar" src={currentUser.avatar} />
                    <span className="name">{currentUser.name}</span>
                  </span>
                </Dropdown>
              ) : (
                <Spin size="small" style={{ marginLeft: 8 }} />
              )}
            </div>
          ) : (
            <div className="right">
              <Link to="/login">Login</Link>
            </div>
          )}
        </Header>
      </div>
    );
  }
}
