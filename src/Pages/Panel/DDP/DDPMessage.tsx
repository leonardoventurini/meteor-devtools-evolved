import React, { FunctionComponent } from 'react';
import moment from 'moment';
import { Icon, Tag } from '@blueprintjs/core';

interface Props {
  message: MeteorMessage;
}

export const DDPMessage: FunctionComponent<Props> = ({ message }) => {
  const { content, timestamp, isOutbound, isInbound } = message;

  const direction = (isOutbound?: boolean, isInbound?: boolean) => {
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

  const preview = (content: string) => {
    return content.length > 48 ? content.slice(0, 48).concat('...') : content;
  };

  const time = (timestamp?: number) =>
    timestamp ? moment(timestamp).format('HH:mm:ss.SSS') : 'Unknown';

  return (
    <div className='mde-ddp__log-row'>
      <div className='time'>
        <Tag minimal>{time(timestamp)}</Tag>
      </div>
      <div className='direction'>{direction(isOutbound, isInbound)}</div>
      <div className='content'>{preview(content)}</div>
    </div>
  );
};
