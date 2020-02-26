import React, { FunctionComponent } from 'react';
import {
  isArray,
  isBoolean,
  isNumber,
  isObject,
  isString,
  toPairs,
} from 'lodash';

import '../../Styles/ObjectTree.scss';
import { Collapsible } from './Collapsible';

interface Renderer {
  property: string;
  child: object;
  level: number;
}

const RenderArray: FunctionComponent<Renderer> = ({
  property,
  child,
  level,
}) => (
  <li key={property} role='array'>
    <strong role='property'>{property}</strong>
    <ObjectTreeNode object={child} level={level + 1} />
  </li>
);

const RenderObject: FunctionComponent<Renderer> = ({
  property,
  child,
  level,
}) => (
  <li key={property} role='object'>
    <strong role='property'>{property}</strong>
    <ObjectTreeNode object={child} level={level + 1} />
  </li>
);

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

const renderBoolean = (key: string, child: boolean) => (
  <li key={key} role='boolean'>
    <span role='property'>{key}</span>:&nbsp;
    <span role='boolean'>{JSON.stringify(child)}</span>
  </li>
);

const ObjectTreeNode: FunctionComponent<{
  object: { [key: string]: any };
  level: number;
}> = ({ object, level }) => {
  if (isArray(object)) {
    return (
      <Collapsible object={object} level={level}>
        <ol start={0}>
          {object.map((item, index) => (
            <li key={index} role='item'>
              <span role='index'>{index}:</span>
              <ObjectTreeNode object={item} level={level + 1} />
            </li>
          ))}
        </ol>
      </Collapsible>
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

    if (isBoolean(child)) {
      return renderBoolean(key, child);
    }

    return renderString(key, JSON.stringify(child));
  });

  return (
    <Collapsible object={object} level={level}>
      <ul>{children}</ul>
    </Collapsible>
  );
};

export const ObjectTree: FunctionComponent<{
  object?: { [key: string]: any };
}> = ({ object }) => (
  <div role='tree'>
    {object && <ObjectTreeNode object={object} level={1} />}
  </div>
);
