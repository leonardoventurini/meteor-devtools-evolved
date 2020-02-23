import React, { FunctionComponent } from 'react';
import { PanelStoreConstructor } from '../../../Stores/PanelStore';
import { Icon, IconName, Tag, Tooltip } from '@blueprintjs/core';
import { detectType } from './FilterConstants';

const MAX_PREVIEW_LENGTH = 40;

interface Props {
  log: DDPLog;
  store: PanelStoreConstructor;
}

const preview = (content: string, max: number) => {
  return content.length > max ? content.slice(0, max).concat('...') : content;
};

const getTag = (icon: IconName, title: string) => (
  <Tooltip content={title} hoverOpenDelay={800} position='top'>
    <Icon
      icon={icon}
      style={{ marginRight: 10, marginBottom: 1 }}
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
      return getTag('code', 'Method');
    default:
      return getTag('warning-sign', 'Unknown');
  }
};

const getMessage = (log: DDPLog, filterType?: FilterType | null) => {
  if (log.parsedContent) {
    const content = log.parsedContent;

    if (filterType === 'heartbeat') {
      return content.msg;
    }

    if (filterType === 'collection') {
      return `${content.msg} to ${content.collection}`;
    }

    if (filterType === 'connection') {
      return content.session
        ? `${content.msg} to ${content.session}`
        : content.msg;
    }
  }

  return preview(log.content, MAX_PREVIEW_LENGTH);
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
