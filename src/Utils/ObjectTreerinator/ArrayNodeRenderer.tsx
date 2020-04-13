import React from 'react';
import { ObjectTreeNode } from '@/Utils/ObjectTreerinator/index';

export const ArrayNodeRenderer = (child: any, level: number) => {
  switch (typeof child) {
    case 'string':
      return <span role='string'>{`"${child}"`}</span>;
    case 'number':
      return <span role='number'>{child}</span>;
    case 'boolean':
      return <span role='boolean'>{JSON.stringify(child)}</span>;
    case 'object':
      return <ObjectTreeNode object={child} level={level + 1} />;
    default:
      return <span role='string'>{`"${JSON.stringify(child)}"`}</span>;
  }
};
