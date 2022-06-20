import React, { FunctionComponent } from 'react'
import { ObjectTreeNode } from '@/Utils/ObjectTreerinator/index'

interface Props {
 property: string
 child: object
 level: number
}

export const ObjectRenderer: FunctionComponent<Props> = ({
 property,
 child,
 level,
}) => (
 <li key={property}>
  <span role="collapsible-property">{property}</span>
  <ObjectTreeNode object={child} level={level + 1} />
 </li>
)
