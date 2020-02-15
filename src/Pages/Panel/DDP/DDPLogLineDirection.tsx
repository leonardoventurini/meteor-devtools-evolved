import React, { FunctionComponent } from 'react';
import { Icon } from '@blueprintjs/core';

interface Prop {
  log: DDPLog;
}

export const DDPLogLineDirection: FunctionComponent<Prop> = ({ log }) => {
  const { isOutbound, isInbound } = log;

  if (isOutbound && isInbound) {
    return <Icon icon='full-circle' />;
  }

  if (isOutbound) {
    return <Icon icon='arrow-top-right' intent='danger' />;
  }

  if (isInbound) {
    return <Icon icon='arrow-bottom-left' intent='success' />;
  }

  return <Icon icon='warning-sign' intent='warning' />;
};
