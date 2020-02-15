import React, { FunctionComponent } from 'react';
import { PanelStoreConstructor } from '../../../Stores/PanelStore';
import { Tag } from '@blueprintjs/core';

const MAX_PREVIEW_LENGTH = 64;

interface Props {
  log: DDPLog;
  store: PanelStoreConstructor;
}

const preview = (content: string) => {
  return content.length > MAX_PREVIEW_LENGTH
    ? content.slice(0, MAX_PREVIEW_LENGTH).concat('...')
    : content;
};

export const DDPLogPreview: FunctionComponent<Props> = ({ log, store }) => (
  <Tag
    interactive
    minimal
    onClick={() => {
      store.setActiveLog(log);
    }}
  >
    <small>
      <code>{preview(log.content)}</code>
    </small>
  </Tag>
);
