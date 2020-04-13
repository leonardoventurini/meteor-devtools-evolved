import React, { FunctionComponent } from 'react';
import { ObjectTreeNode } from '@/Utils/ObjectTreerinator/index';

interface Props {
  property: string;
  child: object;
  level: number;
}

export const ObjectRenderer: FunctionComponent<Props> = ({
  property,
  child,
  level,
}) => (
  <li key={property}>
    <strong role='property'>{property}</strong>
    <ObjectTreeNode object={child} level={level + 1} />
  </li>
);
