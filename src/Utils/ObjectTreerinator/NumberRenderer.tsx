import React from 'react'
import { TreeMatch } from './TreeMatch'

export const NumberRenderer = (key: string, child: number) => (
  <li key={key}>
    <span role='property'>
      <TreeMatch text={key} />
    </span>
    :&nbsp;
    <span role='number'>
      <TreeMatch text={String(child)} />
    </span>
  </li>
)
