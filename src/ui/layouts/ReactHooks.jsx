/**
 * Created by kriz on 21/11/2018.
 */

import React, { useState } from 'react';
import { Button } from 'antd';

// test react hooks working
export const ReactHooks = ({}) => {
  const [state, setState] = useState(0);

  return <Button onClick={() => setState(state + 1)}>Click ME {state}</Button>;
};
