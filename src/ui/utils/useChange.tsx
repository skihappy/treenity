import { useCallback, useEffect, useState } from 'react';
import { Class } from '../../tree';

export default function useChange(value, onChange) {
  const [v, setV] = useState(value);
  const [touched, setTouched] = useState(false);
  const change = useCallback(
    (newValue, ...args) => {
      if (!touched) setTouched(true);

      let setValue = newValue;
      if (value instanceof Class) {
        setValue = new value.constructor(newValue);
      }
      setV(setValue);
      onChange(newValue, ...args);
    },
    [onChange, touched],
  );
  useEffect(() => {
    if (!touched) setV(value);
  }, [value, touched]);

  return [v, change];
}
