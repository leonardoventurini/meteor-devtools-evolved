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
  const [isCollapsed, setIsCollapsed] = useState(level > 1);

  if (isCollapsed) {
    if (isArray(object)) {
      return (
        <span role='expand' onClick={() => setIsCollapsed(false)}>{`[${
          (object as any[]).length
        }]`}</span>
      );
    }

    if (isObject(object)) {
      return (
        <span role='expand' onClick={() => setIsCollapsed(false)}>{`{${
          Object.keys(object).length
        }}`}</span>
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
