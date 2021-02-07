import { getActions } from '../../mst/get-actions';

export default function saveNode(app, node, callback) {
  const actions = getActions(node, callback);
  app.service('tree').patch(node._id, actions, {});
}
