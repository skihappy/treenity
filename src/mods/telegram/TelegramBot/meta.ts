import { types } from 'mobx-state-tree';

export default ({ meta }) => {
  // telegram.TelegramBot
  meta('telegram.actions.TelegramBot', types.model({}));
}
