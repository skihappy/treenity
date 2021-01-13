import React from 'react';
import { T } from '../../i18n';

const ConnectionNotification = () => (
  <div className="notifications">
    <div className="notification">
      <span className="icon-sync" />
      <div className="meta">
        <div className="title-notification">
          {T(`components.connectionNotification.tryingToConnect`)}
        </div>
        <div className="description">{T(`components.connectionNotification.connectionIssue`)}</div>
      </div>
    </div>
  </div>
);

export default ConnectionNotification;
