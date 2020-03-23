import { PanelStoreConstructor } from '@/Stores/PanelStore';
import { StringUtils } from '@/Utils/StringUtils';
import { Tag } from '@blueprintjs/core';
import React, { FunctionComponent } from 'react';

interface Props {
  panelStore: PanelStoreConstructor;
  collectionName: string;
  color: string;
  document: Document;
}

export const MinimongoRow: FunctionComponent<Props> = ({
  panelStore,
  document,
  collectionName,
  color,
}) => (
  <div key={document._id} className='mde-minimongo__row'>
    <Tag
      className='mde-minimongo__row__collection'
      style={{ cursor: 'pointer', backgroundColor: color }}
      minimal
      onClick={() =>
        panelStore.minimongoStore.setActiveCollection(collectionName)
      }
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
