import {
  isArray,
  isBoolean,
  isNil,
  isNumber,
  isObject,
  isString,
  toPairs,
} from 'lodash'
import React, { ChangeEvent, FunctionComponent, useMemo, useState } from 'react'

import { Collapsible } from './Collapsible'
import { StringRenderer } from '@/Utils/ObjectTreerinator/StringRenderer'
import { ArrayRenderer } from '@/Utils/ObjectTreerinator/ArrayRenderer'
import { ObjectRenderer } from '@/Utils/ObjectTreerinator/ObjectRenderer'
import { BooleanRenderer } from '@/Utils/ObjectTreerinator/BooleanRenderer'
import { NumberRenderer } from '@/Utils/ObjectTreerinator/NumberRenderer'
import { NullRenderer } from '@/Utils/ObjectTreerinator/NullRenderer'
import styled from 'styled-components'
import {
  DEFAULT_TREE_DEPTH,
  MAXIMUM_TREE_DEPTH,
  MINIMUM_TREE_DEPTH,
  normalizeTreeDepth,
  TREE_DEPTH_STORAGE_KEY,
  type TreeExpansionMode,
} from './TreeExpansion'
import { TreeExpansionContext } from './TreeExpansionContext'
import { Button, InputGroup } from '@blueprintjs/core'
import { filterJsonTree } from './TreeFilter'
import { TreeSearchContext } from './TreeSearchContext'

const TreeWrapper = styled.div`
  font-family: monospace;
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

  mark {
    padding: 0;
    color: inherit;
    background: #8a6d1d;
    outline: 1px solid #d99e0b;
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

const TreeToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem 0;

  label {
    display: inline-flex;
    align-items: center;
    gap: 0.33rem;
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
}> = ({ object }) => {
  const [defaultDepth, setDefaultDepth] = useState(() => {
    try {
      return normalizeTreeDepth(localStorage.getItem(TREE_DEPTH_STORAGE_KEY))
    } catch {
      return DEFAULT_TREE_DEPTH
    }
  })
  const [mode, setMode] = useState<TreeExpansionMode>('default')
  const [search, setSearch] = useState('')
  const filteredTree = useMemo(
    () => filterJsonTree(object, search),
    [object, search],
  )
  const visibleObject = filteredTree.matched
    ? (filteredTree.value as { [key: string]: any })
    : undefined
  const effectiveMode = search.trim() ? 'expand-all' : mode

  const updateDefaultDepth = (event: ChangeEvent<HTMLSelectElement>) => {
    const depth = normalizeTreeDepth(event.target.value)

    setDefaultDepth(depth)
    setMode('default')

    try {
      localStorage.setItem(TREE_DEPTH_STORAGE_KEY, String(depth))
    } catch {
      // Browser privacy settings may make local storage unavailable.
    }
  }

  return (
    <TreeExpansionContext.Provider
      value={{ defaultDepth, mode: effectiveMode }}
    >
      <TreeSearchContext.Provider value={search}>
        <TreeToolbar aria-label='JSON tree controls'>
          <InputGroup
            aria-label='Filter JSON keys and values'
            leftIcon='search'
            onChange={event => setSearch(event.target.value)}
            placeholder='Filter keys and values'
            type='search'
            value={search}
          />
          <Button
            aria-label='Expand all JSON nodes'
            icon='expand-all'
            minimal
            onClick={() => setMode('expand-all')}
          >
            Expand all
          </Button>
          <Button
            aria-label='Collapse all JSON nodes'
            icon='collapse-all'
            minimal
            onClick={() => setMode('collapse-all')}
          >
            Collapse all
          </Button>
          <label>
            Default depth
            <select
              aria-label='Default JSON expansion depth'
              onChange={updateDefaultDepth}
              value={defaultDepth}
            >
              {Array.from(
                {
                  length: MAXIMUM_TREE_DEPTH - MINIMUM_TREE_DEPTH + 1,
                },
                (_, index) => index + MINIMUM_TREE_DEPTH,
              ).map(depth => (
                <option key={depth} value={depth}>
                  {depth}
                </option>
              ))}
            </select>
          </label>
        </TreeToolbar>
        <TreeWrapper>
          {visibleObject ? (
            <ObjectTreeNode object={visibleObject} level={1} />
          ) : (
            <p role='status'>No matching keys or values.</p>
          )}
        </TreeWrapper>
      </TreeSearchContext.Provider>
    </TreeExpansionContext.Provider>
  )
}
