import React, { FunctionComponent } from 'react';
import { Icon, Tag } from '@blueprintjs/core';

interface Props {
  count: number;
  clear?: () => void;
}

export const CountIndicator: FunctionComponent<Props> = ({ count, clear }) => (
  <Tag intent='warning' minimal round interactive={!!clear} onClick={clear}>
    <Icon
      icon='inbox'
      style={{ marginRight: 4, marginBottom: 1 }}
      iconSize={12}
    />
    {count}
  </Tag>
);
