import { StringUtils } from '@/Utils/StringUtils';
import { Tag } from '@blueprintjs/core';
import React, { CSSProperties, FunctionComponent } from 'react';
import styled from 'styled-components';
import { truncate } from '@/Styles/Mixins';

const Wrapper = styled.div`
  &,
  & code {
    font-family: 'Iosevka Medium', monospace;
    font-size: 12px;
  }

  .collection {
    ${truncate};
    cursor: pointer;
    flex: 0 0 auto;
  }

  .preview {
    ${truncate};
    flex: 0 1 auto;
  }
`;

interface Props {
  document: IDocument;
  collectionName: string;
  style: CSSProperties;
  onClick: () => void;
  onCollectionClick: () => void;
  isAllVisible: boolean;
}

export const MinimongoRow: FunctionComponent<Props> = ({
  style,
  onClick,
  onCollectionClick,
  document,
  collectionName,
  isAllVisible,
}) => {
  return (
    <Wrapper className='row' style={style}>
      {isAllVisible && (
        <Tag
          className='collection'
          style={{ cursor: 'pointer' }}
          minimal
          onClick={() => onCollectionClick()}
        >
          {collectionName}
        </Tag>
      )}
      <Tag className='preview' minimal interactive onClick={() => onClick()}>
        <code>{StringUtils.truncate(JSON.stringify(document), 256)}</code>
      </Tag>
    </Wrapper>
  );
};
