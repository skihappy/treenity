// import Reconciler from 'react-reconciler/cjs/react-reconciler.production.min'
import React from 'react';
import Reconciler from 'react-reconciler/cjs/react-reconciler.development';

const emptyObject = {};

// Behold ... 💩

const Renderer = Reconciler({
  supportsMutation: true,
  isPrimaryRenderer: true,
  now: () => Date.now(),
  createInstance() {
    return null;
  },
  appendInitialChild() {
  },
  appendChild() {
  },
  appendChildToContainer() {
  },
  insertBefore() {
  },
  removeChild() {
  },
  removeChildFromContainer() {
  },
  commitUpdate() {
  },
  getPublicInstance(instance) {
    return instance;
  },
  getRootHostContext() {
    return emptyObject;
  },
  getChildHostContext() {
    return emptyObject;
  },
  createTextInstance() {
  },
  finalizeInitialChildren() {
    return false;
  },
  prepareUpdate() {
    return emptyObject;
  },
  shouldDeprioritizeSubtree() {
    return false;
  },
  prepareForCommit() {
    return null;
  },
  resetAfterCommit() {
  },
  shouldSetTextContent() {
    return false;
  },
  schedulePassiveEffects(callback) {
    callback();
  },
  cancelPassiveEffects(callback) {
  },
  clearContainer(container) {
    // console.log('clear container', container);
  },
});

export function render(element) {
  const root = Renderer.createContainer({}, 0, false, null);
  Renderer.updateContainer(element, root, null, undefined);
  return () => Renderer.updateContainer(React.createElement(React.Fragment), root, null, undefined);
}
