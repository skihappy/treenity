import { meta } from '../../treenity/meta/meta.model';
import { types } from 'mobx-state-tree';
import { addComponent } from '../../treenity/context/context-db';
import { useEffect } from 'react';

export const TelegramBot = meta('tg.bot', types.model({
  token: '',
}));

addComponent(TelegramBot, 'service', {}, ({ value }) => {
  useEffect(() => {
    console.log('starting telegram', value.token);
    const token = value.token;
    return () => console.log('stopping telegram', token);
  }, []);
  return null;
});
