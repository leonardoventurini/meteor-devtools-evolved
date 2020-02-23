import React, { FunctionComponent } from 'react';

export const StatusBar: FunctionComponent = ({ children }) => (
  <div className='mde-layout__status'>{children}</div>
);
