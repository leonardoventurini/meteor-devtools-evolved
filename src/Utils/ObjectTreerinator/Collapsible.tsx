import React, { FunctionComponent, useState } from 'react';
import { isArray, isObject } from 'lodash';

interface Props {
  object: any;
  level?: number;
}

export const Collapsible: FunctionComponent<Props> = ({
  children,
  object,
  level = 0,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(level > 2);

  if (isCollapsed) {
    if (isArray(object)) {
      const length = (object as any[]).length;

      return (
        <span
          role='expand'
          onClick={() => length && setIsCollapsed(false)}
        >{`[${length}]`}</span>
      );
    }

    if (isObject(object)) {
      const length = Object.keys(object).length;

      return (
        <span
          role='expand'
          onClick={() => length && setIsCollapsed(false)}
        >{`{${length}}`}</span>
      );
    }
  }

  return (
    <>
      {level > 1 && (
        <span role='collapse' onClick={() => setIsCollapsed(true)}>
          [-]
        </span>
      )}
      {children}
    </>
  );
};
