import React from 'react'

export const BooleanRenderer = (key: string, child: boolean) => (
 <li key={key}>
  <span role="property">{key}</span>:&nbsp;
  <span role="boolean">{JSON.stringify(child)}</span>
 </li>
)
