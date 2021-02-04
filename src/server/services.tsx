import React from 'react';
import { render } from '../treenity/react/react-nil';
import { AppProvider } from '../treenity/react/useApp';
import { Context } from '../treenity/context/meta-context';
import { RenderMeta } from '../treenity/react/render-meta';

export default async (app) => {
  const root = await app.service('tree').get('root');

  app.serverStopper = render(
    <AppProvider value={app}>
      <Context value="!service">
        <RenderMeta value={root} />
      </Context>
    </AppProvider>,
  );
}
