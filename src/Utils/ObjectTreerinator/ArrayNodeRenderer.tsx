import React from 'react'
import { ObjectTreeNode } from '@/Utils/ObjectTreerinator/index'
import { isArray, isBoolean, isNil, isNumber, isObject, isString } from 'lodash'
import { Collapsible } from '@/Utils/ObjectTreerinator/Collapsible'
import { TreeMatch } from './TreeMatch'

export const ArrayNodeRenderer = (child: any, level: number) => {
  if (isNil(child))
    return (
      <span role='null' style={{ marginLeft: '.33rem' }}>
        <TreeMatch text='null' />
      </span>
    )

  if (isString(child))
    return (
      <span role='string'>
        &quot;
        <TreeMatch text={child} />
        &quot;
      </span>
    )

  if (isNumber(child))
    return (
      <span role='number'>
        <TreeMatch text={String(child)} />
      </span>
    )

  if (isBoolean(child))
    return (
      <span role='boolean'>
        <TreeMatch text={JSON.stringify(child)} />
      </span>
    )

  if (isArray(child))
    return (
      <Collapsible object={child} level={level + 1}>
        <ol start={0} role='array'>
          {child.map((item, index) => (
            <li key={index} role='item'>
              <span role='index'>
                <TreeMatch text={String(index)} />:
              </span>
              {ArrayNodeRenderer(item, level + 1)}
            </li>
          ))}
        </ol>
      </Collapsible>
    )

  if (isObject(child))
    return <ObjectTreeNode object={child} level={level + 1} />

  return <span role='string'>{`"${JSON.stringify(child)}"`}</span>
}
