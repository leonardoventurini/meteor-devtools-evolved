import React from 'react';

export const NullRenderer = (key: string) => (
  <li key={key}>
    <span role='property'>{key}</span>:&nbsp;
    <span role='null'>null</span>
  </li>
);
