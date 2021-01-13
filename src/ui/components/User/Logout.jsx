/**
 * Created by kriz on 28/11/2018.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';

const Logout = ({ loginUrl = '/' }) => {
  const navigate = useNavigate();
  useEffect(() => {
    Meteor.logout();
    navigate(loginUrl);
  });
  return null;
};

export default Logout;
