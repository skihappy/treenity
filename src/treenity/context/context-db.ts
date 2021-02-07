/**
 * Created by kriz on 12/12/2020.
 */

import { each, memoize } from 'lodash';
import { IAnyModelType, Instance } from 'mobx-state-tree';
import { matchBestContext } from './match-context';

export const typeContexts = {
  default: {},
  notfound: {},
};

export type AnyAddComponentContext = string | string[] | { [context: string]: any };

export function addComponent<T extends IAnyModelType>(
  type: T,
  context: AnyAddComponentContext,
  config: Object | ContextComponent<T>,
  component?: ContextComponent<T>,
) {
  if (!component && !config) {
    console.warn('Component is undefined while adding', type, context);
  }
  if (!component) {
    component = config as ContextComponent<T>;
    config = {};
  }

  const contexts = typeContexts[type.name] || (typeContexts[type.name] = {});

  // save type-context-component relation to our db
  if (Array.isArray(context)) {
    context.forEach((c) => {
      contexts[c] = { component, ...config };
    });
  } else if (typeof context === 'object') {
    each(context, (contextConfig, name) => {
      contexts[name] = { ...config, ...contextConfig, component, context };
    });
  } else if (typeof context === 'string') {
    contexts[context] = { ...config, component, context };
  } else {
    throw new TypeError(`context of unknown type: ${typeof context}`);
  }
}

export const matchContexts = (contexts: { [context: string]: object }, matchTags: string) => {
  const context = matchBestContext(Object.keys(contexts), matchTags);
  if (!context) return null;
  return contexts[context];
};

// TODO: fix callback type value from any
export interface ContextComponentProps<T extends IAnyModelType> {
  value: Instance<T>;
  onChange: <Params extends any[] = any[0]>(callback: (value: Instance<T>, ...params: Params) => void) => (...params: Params) => void;
}

export type ContextComponent<T extends IAnyModelType> = (props: ContextComponentProps<T>) => any | object;

interface TypeContextConfig {
  component: ContextComponent<any>;

  props?: any;

  [name: string]: any;
}

export const getTypeContextConfig = memoize(
  function getTypeContextConfig(typeName: string, context: string): TypeContextConfig | null {
    const contexts = typeContexts[typeName];

    if (!contexts) return null;

    const config = matchContexts(contexts, context) || contexts.resolve?.(context);
    return config;
  },
  (typeName, context) => `${typeName}_${context}`,
);

// export const findTypeContextConfig = (typeNames, context, noWarn = false) => {
//   return typeNames.find((typeName, idx) => getTypeContextConfig(typeName, context));
// };
export const findTypeContextIndex = (typeNames, context, noWarn = false) => {
  return typeNames.findIndex((typeName) => getTypeContextConfig(typeName, context));
};
