import React from 'react'
import { TreeMatch } from './TreeMatch'

export const StringRenderer = (key: string, child: string) => (
  <li key={key}>
    <span role='property'>
      <TreeMatch text={key} />
    </span>
    :&nbsp;
    <span role='string'>
      &quot;
      <TreeMatch text={child} />
      &quot;
    </span>
  </li>
)
