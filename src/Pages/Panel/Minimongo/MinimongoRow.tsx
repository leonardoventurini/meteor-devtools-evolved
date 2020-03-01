import React, { FunctionComponent } from 'react';
import { Tag } from '@blueprintjs/core';
import { StringUtils } from '@/Utils/StringUtils';
import { PanelStoreConstructor } from '@/Stores/PanelStore';

interface Props {
  panelStore: PanelStoreConstructor;
  document: Document;
}

export const MinimongoRow: FunctionComponent<Props> = ({
  panelStore,
  document,
}) => (
  <div key={document._id} className='mde-minimongo__row'>
    <Tag
      minimal
      interactive
      onClick={() => panelStore.setActiveObject(document)}
    >
      <code>{StringUtils.truncate(JSON.stringify(document), 64)}</code>
    </Tag>
  </div>
);
