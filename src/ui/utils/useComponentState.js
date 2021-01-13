import { useState } from 'react';

export const useComponentState = initial => {
  const [state, setState] = useState(initial);
  const updateState = state => setState(s => ({ ...s, ...state }));
  return [state, updateState];
};
