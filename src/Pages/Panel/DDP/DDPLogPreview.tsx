import React, { FunctionComponent } from 'react';
import { PanelStoreConstructor } from '../../../Stores/PanelStore';
import { Tag } from '@blueprintjs/core';

const MAX_PREVIEW_LENGTH = 40;

interface Props {
  log: DDPLog;
  store: PanelStoreConstructor;
}

const preview = (content: string, max: number) => {
  return content.length > max ? content.slice(0, max).concat('...') : content;
};

export const DDPLogPreview: FunctionComponent<Props> = ({ log, store }) => {
  const message =
    log?.parsedContent?.msg ?? preview(log.content, MAX_PREVIEW_LENGTH);

  return (
    <Tag
      interactive
      minimal
      onClick={() => {
        store.setActiveLog(log);
      }}
    >
      <small>
        <code>{message}</code>
      </small>
    </Tag>
  );
};
