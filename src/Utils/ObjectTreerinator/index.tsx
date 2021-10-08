import {
  isArray,
  isBoolean,
  isNil,
  isNumber,
  isObject,
  isString,
  toPairs,
} from 'lodash'
import React, { FunctionComponent } from 'react'

import { Collapsible } from './Collapsible'
import { StringRenderer } from '@/Utils/ObjectTreerinator/StringRenderer'
import { ArrayRenderer } from '@/Utils/ObjectTreerinator/ArrayRenderer'
import { ObjectRenderer } from '@/Utils/ObjectTreerinator/ObjectRenderer'
import { BooleanRenderer } from '@/Utils/ObjectTreerinator/BooleanRenderer'
import { NumberRenderer } from '@/Utils/ObjectTreerinator/NumberRenderer'
import { NullRenderer } from '@/Utils/ObjectTreerinator/NullRenderer'
import styled from 'styled-components'

const TreeWrapper = styled.div`
  font-family: 'Iosevka Medium', monospace;
  font-size: 12px;
  padding: 1rem;

  span[role='collapsible-property'] {
    color: #669eff;
  }

  span[role='property'] {
    color: #ff6e4a;
  }

  span[role='index'] {
    color: #808080;
  }

  span[role='string'] {
    color: #c88953;
  }

  span[role='null'] {
    color: #c274c2;
  }

  span[role='number'] {
    color: #ad99ff;
  }

  span[role='boolean'] {
    color: #c274c2;
  }

  span[role='expand'],
  span[role='collapse'] {
    font-family: monospace;
    color: #808080;
    margin-left: 0.33rem;
    cursor: pointer;
    user-select: none;
  }

  ul,
  ol {
    list-style: none;
    padding-left: 1rem;
    margin: 0;
  }

  & > ul,
  & > ol {
    padding: 0;
  }
`

export const ObjectTreeNode: FunctionComponent<{
  object: { [key: string]: any }
  level: number
}> = ({ object, level }) => {
  if (!(typeof object === 'object' && object?.constructor === Object)) {
    console.error('Invalid Object')
    console.debug(object)
  }

  const children = toPairs(object).map(([key, child]) => {
    if (isString(child)) return StringRenderer(key, child)

    if (isNumber(child)) return NumberRenderer(key, child)

    if (isBoolean(child)) return BooleanRenderer(key, child)

    if (isNil(child)) return NullRenderer(key)

    if (isArray(child))
      return (
        <ArrayRenderer key={key} property={key} child={child} level={level} />
      )

    if (isObject(child))
      return (
        <ObjectRenderer key={key} property={key} child={child} level={level} />
      )

    return StringRenderer(key, JSON.stringify(child))
  })

  return (
    <Collapsible object={object} level={level}>
      <ul role='object'>{children}</ul>
    </Collapsible>
  )
}

export const ObjectTreerinator: FunctionComponent<{
  object?: { [key: string]: any }
}> = ({ object }) => (
  <TreeWrapper>
    {object && <ObjectTreeNode object={object} level={1} />}
  </TreeWrapper>
)
