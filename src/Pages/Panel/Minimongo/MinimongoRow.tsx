import { PanelStoreConstructor } from '@/Stores/PanelStore';
import { StringUtils } from '@/Utils/StringUtils';
import { Tag } from '@blueprintjs/core';
import React, { CSSProperties, FunctionComponent } from 'react';

interface Props {
  panelStore: PanelStoreConstructor;
  document: Document;
  style: CSSProperties;
}

export const MinimongoRow: FunctionComponent<Props> = ({
  style,
  panelStore,
  document,
}) => (
  <div key={document._id} className='minimongo-row' style={style}>
    <Tag
      className='minimongo-row-preview'
      minimal
      interactive
      onClick={() => panelStore.setActiveObject(document)}
    >
      <code>{StringUtils.truncate(JSON.stringify(document), 256)}</code>
    </Tag>
  </div>
);
