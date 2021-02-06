import { addComponent } from '../../treenity/context/context-db';
import { useEffect } from 'react';
import { TelegramBot } from './TelegramBot.meta';

addComponent(TelegramBot, 'service', {}, ({ value }) => {
  useEffect(() => {
    console.log('starting telegram', value.token);
    const token = value.token;
    return () => console.log('stopping telegram', token);
  }, []);
  return null;
});
