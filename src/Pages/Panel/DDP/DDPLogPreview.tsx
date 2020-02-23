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

const idFormat = (message: string, id?: string | number | null | false) => {
  if (id === false || id === undefined || id === null) {
    return message;
  }

  return `[${id}] ${message}`;
};

const getMessage = (log: DDPLog, filterType?: FilterType | null) => {
  if (log.parsedContent) {
    const { msg, collection, session, id, method, result } = log.parsedContent;

    const message = (() => {
      if (filterType === 'heartbeat') {
        return msg;
      }

      if (filterType === 'collection') {
        const prepMap: { [key: string]: string } = {
          added: 'to',
          removed: 'from',
          changed: 'at',
        };

        if (msg && msg in prepMap) {
          return `${msg} ${prepMap[msg]} ${collection}`;
        }
      }

      if (filterType === 'connection') {
        return session ? session : msg;
      }

      if (filterType === 'subscription') {
        return msg;
      }

      if (filterType === 'method') {
        if (msg === 'method') {
          return method;
        }

        if (msg === 'result') {
          return preview(JSON.stringify(result), MAX_PREVIEW_LENGTH);
        }

        return msg;
      }
    })();

    if (message) {
      return idFormat(message, id);
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
