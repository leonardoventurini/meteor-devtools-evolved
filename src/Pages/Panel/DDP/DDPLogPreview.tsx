import { usePanelStore } from '@/Stores/PanelStore';
import { Icon, IconName, Tag, Tooltip } from '@blueprintjs/core';
import React, { FunctionComponent } from 'react';

const getTag = (icon: IconName, title: string) => (
  <Tooltip
    content={title}
    hoverOpenDelay={800}
    position='top'
    className='content-icon'
  >
    <Icon
      icon={icon}
      style={{
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

export const DDPLogPreview: FunctionComponent<Partial<DDPLog>> = ({
  filterType,
  parsedContent,
  preview,
}) => {
  const store = usePanelStore();

  return (
    <>
      {getTypeTag(filterType)}
      <Tag
        interactive
        minimal
        onClick={() => {
          parsedContent && store.setActiveObject(parsedContent);
        }}
        className='content-preview'
        intent={parsedContent?.error ? 'danger' : 'none'}
      >
        <small>
          <code>{preview}</code>
        </small>
      </Tag>
    </>
  );
};
