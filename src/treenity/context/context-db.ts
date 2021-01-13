/**
 * Created by kriz on 12/12/2020.
 */

import { each, memoize } from 'lodash';
import { IAnyComplexType, IAnyModelType } from 'mobx-state-tree';
import { matchBestContext } from './match-context';

export const typeContexts = {
  default: {},
  notfound: {},
};

export type AnyAddComponentContext = string | string[] | Object;

export function addComponent(
  type: IAnyModelType,
  context: AnyAddComponentContext,
  config: Object | ContextComponent,
  component?: ContextComponent,
) {
  if (!component && !config) {
    console.warn('Component is undefined while adding', type, context);
  }
  if (!component) {
    component = config;
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
      contexts[name] = { ...config, ...contextConfig, component };
    });
  } else if (typeof context === 'string') {
    contexts[context] = { component, ...config };
  } else {
    throw new TypeError(`context of unknown type: ${typeof context}`);
  }
}

export const matchContexts = (contexts: { [context: string]: object }, matchTags: string) => {
  const context = matchBestContext(Object.keys(contexts), matchTags);
  if (!context) return null;
  return contexts[context];
};

export type ContextComponent = Function | Object;

interface ContextConfig {
  component: ContextComponent;

  [name: string]: any;
}

export const getTypeContextConfig = memoize(
  function getTypeContextConfig(type: IAnyComplexType, context: string): ContextConfig | null {
    const contexts = typeContexts[type.name];

    if (!contexts) return null;

    const config = matchContexts(contexts, context) || contexts.resolve?.(context);
    return config;
  },
  (type, context) => `${type.name}_${context}`,
);

export const findTypeContextConfig = (types, context, noWarn = false) => {
  return types.find((type) => getTypeContextConfig(type, context));
};

export function getComponent(type: IAnyComplexType, context: string, noWarn = false): ContextComponent | null {
  const info = getTypeContextConfig(type, context);
  if (!info) {
    if (!noWarn) console.warn('Component not found for type', type.name, 'and context', context);
    return null;
  }
  return info.component;
}
