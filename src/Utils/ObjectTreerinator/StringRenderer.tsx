import React from 'react'

export const StringRenderer = (key: string, child: string) => (
  <li key={key}>
    <span role='property'>{key}</span>:&nbsp;
    <span role='string'>{`"${child}"`}</span>
  </li>
)
