import React, { lazy, Suspense } from 'react';

export const Lazy = (func: () => Promise<any>, componentName?: string | undefined) => {
  if (componentName) {
    const origFunc = func;
    func = () => origFunc().then(module => ({ default: module[componentName] }));
  }

  const Component = lazy(func);
  return props => (
    <Suspense fallback={'Loading...'}>
      <Component {...props} />
    </Suspense>
  );
};
