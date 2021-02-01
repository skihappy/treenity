import { meta } from '../../treenity/meta/meta.model';
import { randomId } from '../../common/random-id';
import { Instance, types } from 'mobx-state-tree';

export const TestMeta = meta(
  'test-meta',
  types
    .model({
      name: '',
    })
    .actions((self) => ({
      doSomething() {
        self.name = 'doing' + randomId();
      },
    })),
);

export type ITestMeta = Instance<typeof TestMeta>;

export const TestLayoutMeta = meta(
  'test-layout',
  types
    .model({}),
);

export type ITestLayoutMeta = Instance<typeof TestLayoutMeta>;
