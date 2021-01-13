/**
 * Created by kriz on 30.04.2020.
 */

import React from 'react';

import useTracker from './useTracker';

const useCurrentUser = () => useTracker(() => null /*Meteor.user()*/);

export default useCurrentUser;
