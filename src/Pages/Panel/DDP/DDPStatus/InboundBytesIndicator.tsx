import React, { FunctionComponent } from 'react';
import { Icon, Tag } from '@blueprintjs/core';
import prettyBytes from 'pretty-bytes';

interface Props {
  inboundBytes: number;
}

export const InboundBytesIndicator: FunctionComponent<Props> = ({
  inboundBytes,
}) => (
  <Tag
    minimal
    round
    style={{ marginRight: 10 }}
  >
    <Icon
      icon='cloud-download'
      style={{ marginRight: 4, marginBottom: 1 }}
      iconSize={12}
    />
    {prettyBytes(inboundBytes)}
  </Tag>
);
