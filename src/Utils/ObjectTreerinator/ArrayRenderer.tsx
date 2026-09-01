import React, { FunctionComponent } from 'react'
import { Collapsible } from '@/Utils/ObjectTreerinator/Collapsible'
import { ArrayNodeRenderer } from '@/Utils/ObjectTreerinator/ArrayNodeRenderer'
import { TreeMatch } from './TreeMatch'

interface Props {
  property: string
  child: any[]
  level: number
}

export const ArrayRenderer: FunctionComponent<Props> = ({
  property,
  child,
  level,
}) => (
  <li key={property}>
    <span role='collapsible-property'>
      <TreeMatch text={property} />
    </span>

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
  </li>
)
