import { meta } from '../../treenity/meta/meta.model';
import { types } from 'mobx-state-tree';

export const TelegramBot = meta('tg.bot', types.model({
  token: '',
}));
