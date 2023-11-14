import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Store } from '../Store';

export default function BrandAdmin({ children }) {
  const { state } = useContext(Store);
  const { userInfo } = state;
  
  // Check if the user is an admin or if the user is a brand and is approved
  const allowAccess = userInfo && (userInfo.isAdmin || (userInfo.isBrand && userInfo.isBrandApproved));

  return allowAccess ? children : <Navigate to="/signin" />;
}
