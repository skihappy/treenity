import { Button, Card, Layout, List, Modal, Popover } from 'antd';
import { QuestionCircleOutlined, ShareAltOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons';

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CurrentNode } from '../../treenity/tree/base/CurrentNodeContext';
import MetaContext from '../../tree/context/meta-context';
import ToolbarMenuItem from './ToolbarMenuItem';
import { RenderMeta } from '../../tree/ui/render-meta';
import RightDrawer from '../../components/RightDrawer';
import TagEditor from '../../components/TagEditor';
import { Portal } from '../../helpers/Portal';
import { useToggle } from '../../utils/useBoolean';

const PermissionButton = ({ value, onChange }) => {
  const [permModalVisible, togglePermModal] = useToggle(false);

  return (
    <>
      <Button className="m-l-16" type="ghost" ghost icon={<LockOutlined />} onClick={togglePermModal} />
      {permModalVisible && (
        <Modal
          title="Node permissions"
          visible
          footer={false}
          onCancel={togglePermModal}
          transitionName="none"
          maskTransitionName="none"
        >
          <RenderMeta
            node={value}
            value={value}
            onChange={(values) => {
              onChange(values);
              togglePermModal();
            }}
            context="react permission"
          />
        </Modal>
      )}
    </>
  );
};

export const TreeLayout = ({ node }) => {
  // const [current, setCurrent] = useContext(CurrentNode);
  // const [visible, toggleModal] = useToggle(false);
  const [permModalVisible, togglePermModal] = useToggle(false);

  const removeMeta = (meta) => {
    current.removeMeta(meta);
    current.save();
  };

  const onTags = (meta, tags) => {
    meta._tg = tags;
    meta.node().save();
  };

  const onChange = (nodeValues) => {
    nodeValues.save();
  };

  return (
    <>
      <Portal name="sidebar">
        <div style={{ marginLeft: 19.5 }}>
          {/*<MetaContext context="tree">*/}
          <RenderMeta
            {...{
              node: node,
              value: node,
              currentNode: current && current._id,
              context: 'tree',
              onSelect: setCurrent,
              // cursor: allChildren,
            }}
          />
          <Link className="m-t-16" to="/t">
            &lt; Go to root
          </Link>
          <span style={{ color: 'white' }}> | </span>
          <Link className="m-t-16" to={`/t/${current._id}`}>
            Set as root &gt;
          </Link>
          {/*</MetaContext>*/}
        </div>
      </Portal>
      {current ? (
        <MetaContext context="react" name="layout">
          <Portal name="toolbar">
            <ToolbarMenuItem node={current} />
            <TagEditor className="m-l-16" initialValue={current._tg} onChange={(tags) => onTags(current, tags)} />
            <Popover
              title="Tags"
              content={() => (
                <>
                  hideChildren
                  <br />
                  template
                </>
              )}
            >
              <QuestionCircleOutlined style={{ color: 'red' }} />
            </Popover>
            {/*<Button*/}
            {/*  onClick={toggleModal}*/}
            {/*  icon={<ShareAltOutlined />}*/}
            {/*  type="graph"*/}
            {/*>*/}
            {/*  Flow*/}
            {/*</Button>*/}
            {/*{visible &&*/}
            {/*<Modal*/}
            {/*  title="Node graph"*/}
            {/*  style={{ top: 0 }}*/}
            {/*  visible*/}
            {/*  width="100%"*/}
            {/*  height="100%"*/}
            {/*  footer={false}*/}
            {/*  onCancel={toggleModal}*/}
            {/*  transitionName="none"*/}
            {/*  maskTransitionName="none"*/}
            {/*>*/}
            {/*  <RenderMeta2*/}
            {/*    node={current}*/}
            {/*    meta={current}*/}
            {/*    type="graph"*/}
            {/*    onSubmit={() => toggleModal(false)}*/}
            {/*  />*/}
            {/*</Modal>*/}
            {/*}*/}
            <PermissionButton value={current} onChange={onChange} />
          </Portal>
          <Layout>
            <Layout style={{ position: 'relative' }}>
              <RenderMeta {...{ key: current._id, meta: current, node: current, context: 'react' }} />
            </Layout>
            <RightDrawer title="Properties" width={500}>
              {() => (
                <MetaContext context="edit">
                  <List
                    itemLayout="vertical"
                    dataSource={[current, ...current.meta()]}
                    renderItem={(meta, i) => (
                      <List.Item key={i}>
                        <div style={{ marginBottom: 8 }}>
                          <span>
                            <b>{meta._t}</b> <span style={{ fontSize: '0.8em' }}>({meta._id})</span>
                          </span>
                          <div className="pull-right" style={{ marginTop: -4 }}>
                            <TagEditor initialValue={meta._tg} onChange={(tags) => onTags(meta, tags)} />
                            {/*<Popover content={<TagEditor initialValue={meta._tg} onChange={onTags} />}>*/}
                            {/*  <Button icon="tags-o" ghost type="card-danger" size="small" />*/}
                            {/*</Popover>*/}
                            <Button onClick={() => removeMeta(meta)} type="link">
                              <DeleteOutlined style={{ color: 'red' }} />
                            </Button>
                          </div>
                        </div>
                        <RenderMeta {...{ meta, node: current, context: 'react edit', autosave: false }} />
                      </List.Item>
                    )}
                  />
                </MetaContext>
              )}
            </RightDrawer>
          </Layout>
        </MetaContext>
      ) : (
        <Card>
          <h3>Not found</h3>
        </Card>
      )}
    </>
  );
};
