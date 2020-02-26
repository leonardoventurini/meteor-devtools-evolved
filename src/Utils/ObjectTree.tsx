import React, { FunctionComponent, useState } from 'react';
import { isArray, isNumber, isObject, isString, toPairs } from 'lodash';

import '../Styles/ObjectTree.scss';

interface Renderer {
  property: string;
  child: object;
  level: number;
}

const RenderArray: FunctionComponent<Renderer> = ({
  property,
  child,
  level,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <li key={property} role='array'>
      <strong role='property' onClick={() => setIsCollapsed(!isCollapsed)}>
        {property} {isCollapsed ? `[${(child as any[]).length}]` : ''}
      </strong>
      {isCollapsed || <ObjectTreeNode object={child} level={level + 1} />}
    </li>
  );
};

const RenderObject: FunctionComponent<Renderer> = ({
  property,
  child,
  level,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <li key={property} role='object'>
      <strong role='property' onClick={() => setIsCollapsed(!isCollapsed)}>
        {property} {isCollapsed ? `{${Object.keys(child).length}}` : ''}
      </strong>
      {isCollapsed || <ObjectTreeNode object={child} level={level + 1} />}
    </li>
  );
};

const renderString = (key: string, child: string) => (
  <li key={key} role='string'>
    <span role='property'>{key}</span>:&nbsp;
    <span role='string'>{`"${child}"`}</span>
  </li>
);

const renderNumber = (key: string, child: number) => (
  <li key={key} role='number'>
    <span role='property'>{key}</span>:&nbsp;<span role='number'>{child}</span>
  </li>
);

const ObjectTreeNode: FunctionComponent<{
  object: { [key: string]: any };
  level: number;
  collapsible?: boolean;
}> = ({ object, level, collapsible }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (collapsible && isCollapsed) {
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

  if (isArray(object)) {
    return (
      <ol start={0}>
        {object.map((item, index) => (
          <li key={index}>
            <ObjectTreeNode object={item} level={level + 1} collapsible />
          </li>
        ))}
      </ol>
    );
  }

  const children = toPairs(object).map(([key, child]) => {
    if (isArray(child)) {
      return <RenderArray property={key} child={child} level={level} />;
    }

    if (isObject(child)) {
      return <RenderObject property={key} child={child} level={level} />;
    }

    if (isString(child)) {
      return renderString(key, child);
    }

    if (isNumber(child)) {
      return renderNumber(key, child);
    }

    return renderString(key, JSON.stringify(child));
  });

  return <ul>{children}</ul>;
};

export const ObjectTree: FunctionComponent<{
  object: { [key: string]: any };
}> = ({ object }) => (
  <div role='tree'>
    <ObjectTreeNode object={object} level={1} />
  </div>
);
