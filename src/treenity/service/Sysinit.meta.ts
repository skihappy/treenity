import { meta } from '../meta/meta.model';
import { Instance, types } from 'mobx-state-tree';

export const SysinitMeta = meta('sysinit', types.model({
  name: 'someService',
}));
export type IServiceMeta = Instance<typeof SysinitMeta>;
