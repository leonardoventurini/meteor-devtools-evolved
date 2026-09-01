import React from 'react'
import { TreeMatch } from './TreeMatch'

export const NullRenderer = (key: string) => (
  <li key={key}>
    <span role='property'>
      <TreeMatch text={key} />
    </span>
    :&nbsp;
    <span role='null'>
      <TreeMatch text='null' />
    </span>
  </li>
)
