import React from 'react'
import { TreeMatch } from './TreeMatch'

export const BooleanRenderer = (key: string, child: boolean) => (
  <li key={key}>
    <span role='property'>
      <TreeMatch text={key} />
    </span>
    :&nbsp;
    <span role='boolean'>
      <TreeMatch text={JSON.stringify(child)} />
    </span>
  </li>
)
