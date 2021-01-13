import { useCallback, useState } from 'react';

export function useInputState(initial) {
  const [value, setValue] = useState(initial);
  const setInputValue = useCallback(
    e => {
      const value =
        e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
      setValue(value);
    },
    [setValue],
  );
  return [value, setInputValue];
}
