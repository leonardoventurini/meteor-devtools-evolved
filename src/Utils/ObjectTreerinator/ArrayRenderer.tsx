import React, { FunctionComponent } from 'react';
import { Collapsible } from '@/Utils/ObjectTreerinator/Collapsible';
import { ArrayNodeRenderer } from '@/Utils/ObjectTreerinator/ArrayNodeRenderer';

interface Props {
  property: string;
  child: any[];
  level: number;
}

export const ArrayRenderer: FunctionComponent<Props> = ({
  property,
  child,
  level,
}) => (
  <li key={property}>
    <strong role='property'>{property}</strong>

    <Collapsible object={child} level={level + 1}>
      <ol start={0} role='array'>
        {child.map((item, index) => (
          <li key={index} role='item'>
            <span role='index'>{index}:</span>
            {ArrayNodeRenderer(item, level + 1)}
          </li>
        ))}
      </ol>
    </Collapsible>
  </li>
);
