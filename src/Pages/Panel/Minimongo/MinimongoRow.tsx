import { PanelStoreConstructor } from '@/Stores/PanelStore';
import { StringUtils } from '@/Utils/StringUtils';
import { Tag } from '@blueprintjs/core';
import React, { FunctionComponent } from 'react';

interface Props {
  panelStore: PanelStoreConstructor;
  collectionName: string;
  document: Document;
}

export const MinimongoRow: FunctionComponent<Props> = ({
  panelStore,
  document,
  collectionName,
}) => (
  <div key={document._id} className='mde-minimongo__row'>
    <Tag minimal>{collectionName}</Tag>
    <Tag
      minimal
      interactive
      onClick={() => panelStore.setActiveObject(document)}
    >
      <code>{StringUtils.truncate(JSON.stringify(document), 64)}</code>
    </Tag>
  </div>
);
