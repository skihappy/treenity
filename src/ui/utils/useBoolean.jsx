import { useState } from 'react';

export const useBoolean = (initial = false) => {
  const [state, setState] = useState(initial);
  return [state, val => setState(s => (typeof val === 'boolean' ? val : !s))];
};

export const useToggle = useBoolean;
