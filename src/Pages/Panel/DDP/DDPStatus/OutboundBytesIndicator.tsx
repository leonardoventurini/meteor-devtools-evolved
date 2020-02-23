import React, { FunctionComponent } from 'react';
import { Icon, Tag } from '@blueprintjs/core';
import prettyBytes from 'pretty-bytes';

interface Props {
  outboundBytes: number;
}

export const OutboundBytesIndicator: FunctionComponent<Props> = ({
  outboundBytes,
}) => (
  <Tag
    minimal
    round
    style={{ marginRight: 10 }}
  >
    <Icon
      icon='cloud-upload'
      style={{ marginRight: 4, marginBottom: 1 }}
      iconSize={12}
    />
    {prettyBytes(outboundBytes)}
  </Tag>
);
