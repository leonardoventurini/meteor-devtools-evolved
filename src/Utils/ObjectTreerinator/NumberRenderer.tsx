import React from 'react';

export const NumberRenderer = (key: string, child: number) => (
  <li key={key}>
    <span role='property'>{key}</span>:&nbsp;<span role='number'>{child}</span>
  </li>
);
