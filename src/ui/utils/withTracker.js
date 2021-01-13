import kompose from './react-kompose';
import { Tracker } from 'meteor/tracker';

const getTrackerLoader = reactiveMapper => (props, onData, env) => {
  let trackerCleanup = null;
  const _onData = (result, error) => onData(error, result);

  const handler = Tracker.nonreactive(() =>
    Tracker.autorun(() => {
      trackerCleanup = reactiveMapper(props, _onData, env);
    }),
  );

  return () => {
    if (typeof trackerCleanup === 'function') trackerCleanup();
    return handler.stop();
  };
};

export default function withTracker(composer, options = {}) {
  return kompose(getTrackerLoader(composer), options);
}
