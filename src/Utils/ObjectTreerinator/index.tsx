import {
  isArray,
  isBoolean,
  isNil,
  isNumber,
  isObject,
  isString,
  toPairs,
} from 'lodash';
import React, { FunctionComponent } from 'react';

import '../../Styles/ObjectTree.scss';
import { Collapsible } from './Collapsible';
import { StringRenderer } from '@/Utils/ObjectTreerinator/StringRenderer';
import { ArrayRenderer } from '@/Utils/ObjectTreerinator/ArrayRenderer';
import { ObjectRenderer } from '@/Utils/ObjectTreerinator/ObjectRenderer';
import { BooleanRenderer } from '@/Utils/ObjectTreerinator/BooleanRenderer';
import { NumberRenderer } from '@/Utils/ObjectTreerinator/NumberRenderer';
import { NullRenderer } from '@/Utils/ObjectTreerinator/NullRenderer';

export const ObjectTreeNode: FunctionComponent<{
  object: { [key: string]: any };
  level: number;
}> = ({ object, level }) => {
  if (!(object && object.constructor === Object)) {
    throw new Error('Invalid object.');
  }

  const children = toPairs(object).map(([key, child]) => {
    if (isString(child)) return StringRenderer(key, child);

    if (isNumber(child)) return NumberRenderer(key, child);

    if (isBoolean(child)) return BooleanRenderer(key, child);

    if (isNil(child)) return NullRenderer(key);

    if (isArray(child))
      return (
        <ArrayRenderer key={key} property={key} child={child} level={level} />
      );

    if (isObject(child))
      return (
        <ObjectRenderer key={key} property={key} child={child} level={level} />
      );

    return StringRenderer(key, JSON.stringify(child));
  });

  return (
    <Collapsible object={object} level={level}>
      <ul role='object'>{children}</ul>
    </Collapsible>
  );
};

export const ObjectTreerinator: FunctionComponent<{
  object?: { [key: string]: any };
}> = ({ object }) => (
  <div role='tree'>
    {object && <ObjectTreeNode object={object} level={1} />}
  </div>
);
