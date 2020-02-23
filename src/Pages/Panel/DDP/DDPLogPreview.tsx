import React, { FunctionComponent } from 'react';
import { PanelStoreConstructor } from '../../../Stores/PanelStore';
import { Icon, IconName, Tag, Tooltip } from '@blueprintjs/core';
import { detectType } from './FilterConstants';
import { MessageFormatter } from '../../../Utils/MessageFormatter';
import { truncate } from '../../../Utils/String';
import { isNumber, isString } from 'lodash';

interface Props {
  log: DDPLog;
  store: PanelStoreConstructor;
}

const getTag = (icon: IconName, title: string) => (
  <Tooltip content={title} hoverOpenDelay={800} position='top'>
    <Icon
      icon={icon}
      style={{
        marginRight: 10,
        marginBottom: 1,

        color: '#8a9ba8',
      }}
      iconSize={12}
    />
  </Tooltip>
);

const getTypeTag = (filterType?: FilterType | null) => {
  switch (filterType) {
    case 'heartbeat':
      return getTag('heart', 'Heartbeat');
    case 'connection':
      return getTag('globe-network', 'Connection');
    case 'collection':
      return getTag('database', 'Collection');
    case 'subscription':
      return getTag('feed-subscribed', 'Subscription');
    case 'method':
      return getTag('derive-column', 'Method');
    default:
      return getTag('warning-sign', 'Unknown');
  }
};

const idFormat = (message: string, id?: string | number | null) => {
  if (isNumber(id) || isString(id)) {
    return `[${id}] ${truncate(message)}`;
  }

  return message;
};

const getMessage = (log: DDPLog, filterType?: FilterType | null) => {
  if (log.parsedContent && filterType) {
    const message = (() => {
      if (filterType in MessageFormatter) {
        return MessageFormatter[filterType](log.parsedContent);
      }

      return null;
    })();

    if (message) {
      return idFormat(message, log.parsedContent.id);
    }
  }

  return truncate(log.content);
};

export const DDPLogPreview: FunctionComponent<Props> = ({ log, store }) => {
  const filterType = detectType(log.parsedContent);

  return (
    <>
      {getTypeTag(filterType)}
      <Tag
        interactive
        minimal
        onClick={() => {
          store.setActiveLog(log);
        }}
      >
        <small>
          <code>{getMessage(log, filterType)}</code>
        </small>
      </Tag>
    </>
  );
};
