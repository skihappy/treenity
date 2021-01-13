import { useMemo } from 'react';
import debouncePromise from '../../utils/debounce-promise';

export function useAsyncDebounce(func, timeoutMs, deps) {
  return useMemo(() => debouncePromise(func, timeoutMs), deps);
}
