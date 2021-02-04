import { MutableRefObject, useRef } from 'react';

export function useInitRef<T>(initialValueFunc: () => T): MutableRefObject<T> {
  const ref = useRef<T>() as MutableRefObject<T>;
  if (!ref.current) {
    ref.current = initialValueFunc();
    if (!ref.current) {
      throw new Error('initializer not returned value');
    }
  }
  return ref;
}
