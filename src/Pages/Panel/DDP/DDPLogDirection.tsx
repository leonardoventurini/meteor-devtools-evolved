import { Icon } from '@blueprintjs/core';
import React, { FunctionComponent } from 'react';

interface Prop {
  isOutbound?: boolean;
  isInbound?: boolean;
}

export const DDPLogDirection: FunctionComponent<Prop> = ({
  isOutbound,
  isInbound,
}) => {
  if (isOutbound && isInbound) return <Icon icon='full-circle' iconSize={12} />;

  if (isOutbound)
    return <Icon icon='arrow-top-right' intent='danger' iconSize={12} />;

  if (isInbound)
    return <Icon icon='arrow-bottom-left' intent='success' iconSize={12} />;

  return <Icon icon='warning-sign' intent='warning' iconSize={12} />;
};
