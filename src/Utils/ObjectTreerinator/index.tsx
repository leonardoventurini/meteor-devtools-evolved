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
  <li key={property}>
    <strong role='property'>{property}</strong>
    <ObjectTreeNode object={child} level={level + 1} />
  </li>
);

const RenderObject: FunctionComponent<Renderer> = ({
  property,
  child,
  level,
}) => (
  <li key={property}>
    <strong role='property'>{property}</strong>
    <ObjectTreeNode object={child} level={level + 1} />
  </li>
);

const renderString = (key: string, child: string) => (
  <li key={key}>
    <span role='property'>{key}</span>:&nbsp;
    <span role='string'>{`"${child}"`}</span>
  </li>
);

const renderNumber = (key: string, child: number) => (
  <li key={key}>
    <span role='property'>{key}</span>:&nbsp;<span role='number'>{child}</span>
  </li>
);

const renderBoolean = (key: string, child: boolean) => (
  <li key={key}>
    <span role='property'>{key}</span>:&nbsp;
    <span role='boolean'>{JSON.stringify(child)}</span>
  </li>
);

const ObjectTreeNode: FunctionComponent<{
  object: { [key: string]: any };
  level: number;
}> = ({ object, level }) => {
  const renderArrayNode = (child: any) => {
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

  if (isArray(object)) {
    return (
      <Collapsible object={object} level={level}>
        <ol start={0} role='array'>
          {object.map((item, index) => (
            <li key={index} role='item'>
              <span role='index'>{index}:</span>
              {renderArrayNode(item)}
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
