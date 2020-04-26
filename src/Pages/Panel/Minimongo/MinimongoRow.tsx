import { PanelStoreConstructor } from '@/Stores/PanelStore';
import { StringUtils } from '@/Utils/StringUtils';
import { Tag } from '@blueprintjs/core';
import React, { CSSProperties, FunctionComponent } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  &,
  & code {
    font-family: 'Iosevka Medium', monospace;
    font-size: 12px;
  }
`;

interface Props {
  panelStore: PanelStoreConstructor;
  collectionName: string;
  color: string;
  document: IDocument;
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
  <Wrapper className='minimongo-row' style={style}>
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
  </Wrapper>
);
