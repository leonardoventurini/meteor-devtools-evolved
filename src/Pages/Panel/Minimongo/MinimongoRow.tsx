import { PanelStoreConstructor } from '@/Stores/PanelStore';
import { StringUtils } from '@/Utils/StringUtils';
import { Tag } from '@blueprintjs/core';
import React, { CSSProperties, FunctionComponent } from 'react';

interface Props {
  panelStore: PanelStoreConstructor;
  collectionName: string;
  color: string;
  document: Document;
  style: CSSProperties;
  isAllVisible: boolean;
}

export const MinimongoRow: FunctionComponent<Props> = ({
  isAllVisible,
  style,
  panelStore,
  document,
  collectionName,
  color,
}) => (
  <div className='minimongo-row' style={style}>
    {isAllVisible && (
      <Tag
        className='minimongo-row-collection'
        style={{ cursor: 'pointer', backgroundColor: color }}
        minimal
        onClick={() =>
          panelStore.minimongoStore.setActiveCollection(collectionName)
        }
      >
        {collectionName}
      </Tag>
    )}
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
