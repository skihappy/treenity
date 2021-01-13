import { Card } from 'antd';
import { Meteor } from 'meteor/meteor';
import React, { useCallback, useLayoutEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NamedNode } from '../../mods/types/named-node/NamedNode.meta';
import Tree from '../../tree';
import { CurrentNodeProvider } from '../../tree/base/CurrentNodeContext';
import { LoginPage } from '../components/User/Login';
import { useLogin } from '../utils/useLogin';
import useTracker from '../utils/useTracker';

const Loading = () => (
  <Card>
    <h3>Loading...</h3>
  </Card>
);
// import './TreePage.less';
const Login = ({ children, login, loading }) => {
  const loginData = useLogin();
  if (loginData.loggedIn) return children;

  if (loginData.loggingIn) return React.cloneElement(loading, loginData);

  return React.cloneElement(login, loginData);
};
export const LoadCurrent = ({ children }) => {
  let { rootId, nodeId } = useParams();

  const [root, loading] = useTracker(() => {
    try {
      const sub = Meteor.subscribe(
        'stree',
        rootId || '',
        err => err && console.error('subscribe', err),
      );
      const ready = sub.ready();

      let root;
      if (ready) {
        root = rootId ? Tree.get(rootId) : NamedNode.getRoot();
      }

      return [root, !ready];
    } catch (err) {
      console.error(err);
    }
  }, [rootId]);

  const current = useTracker(() => {
    return nodeId ? Tree.get(nodeId) : root;
  }, [root, nodeId]);

  rootId = rootId || (root && root._id);

  const navigate = useNavigate();
  const setCurrent = useCallback(
    id => {
      if (!id) return;
      if (id === rootId) {
        navigate(`/t/${rootId}`);
      } else {
        navigate(`/t/${rootId}/${id}`);
      }
    },
    [navigate, rootId],
  );

  useLayoutEffect(() => {
    window.document.title = current ? `${current.name} - Treenity` : 'Treenity';
  }, [current]);

  if (!root || !current) {
    if (loading) return <Loading />;
    return (
      <Login login={<LoginPage regUrl="/join" />} loading={<Loading />}>
        <Card>
          <h3>Not found</h3>
        </Card>
      </Login>
    );
  }

  return <CurrentNodeProvider value={[current, setCurrent, root]}>{children}</CurrentNodeProvider>;
};
