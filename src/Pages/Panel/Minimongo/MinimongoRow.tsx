import { MinimongoStore } from '@/Stores/Panel/MinimongoStore';
import { PanelStoreConstructor } from '@/Stores/PanelStore';
import { StringUtils } from '@/Utils/StringUtils';
import { Tag } from '@blueprintjs/core';
import React, { FunctionComponent } from 'react';

interface Props {
  store: MinimongoStore;
  panelStore: PanelStoreConstructor;
  collectionName: string;
  color: string;
  document: Document;
}

export const MinimongoRow: FunctionComponent<Props> = ({
  store,
  panelStore,
  document,
  collectionName,
  color,
}) => (
  <div key={document._id} className='mde-minimongo__row'>
    <Tag
      className='mde-minimongo__row__collection'
      style={{ backgroundColor: color }}
      minimal
      interactive
      onClick={() => store.setActiveCollection(collectionName)}
    >
      {collectionName}
    </Tag>
    <Tag
      className='mde-minimongo__row__preview'
      minimal
      interactive
      onClick={() => panelStore.setActiveObject(document)}
    >
      <code>{StringUtils.truncate(JSON.stringify(document), 256)}</code>
    </Tag>
  </div>
);
