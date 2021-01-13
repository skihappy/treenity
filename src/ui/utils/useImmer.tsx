import produce, { Draft } from 'immer';
import { useCallback, useState } from 'react';

export default function useImmer<S = any>(
  initialValue: S | (() => S),
): [S, (f: (draft: Draft<S>) => void | S) => void];

export default function useImmer(initialValue: any) {
  const [val, updateValue] = useState(initialValue);
  return [
    val,
    useCallback(updater => {
      updateValue(produce(updater));
    }, []),
  ];
}
