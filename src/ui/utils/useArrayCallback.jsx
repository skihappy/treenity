import { useRef } from 'react';

const CurFunc = Symbol('useArrayCallback.currentFunction');
export const useArrayCallback = func => {
  const ref = useRef({});
  ref.current[CurFunc] = func;
  return (key, ...elem) => {
    let info = ref.current[key];
    if (!info) {
      ref.current[key] = info = {};
      info.cb = (...vals) => ref.current[CurFunc](key, ...info.elem, ...vals);
    }
    info.elem = elem;

    return info.cb;
  };
};
