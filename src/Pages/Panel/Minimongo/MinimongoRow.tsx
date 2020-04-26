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
  document: IDocument;
  style: CSSProperties;
  onClick: () => void;
}

export const MinimongoRow: FunctionComponent<Props> = ({
  style,
  onClick,
  document,
}) => {
  return (
    <Wrapper className='row' style={style}>
      <Tag
        className='row-preview'
        minimal
        interactive
        onClick={() => onClick()}
      >
        <code>{StringUtils.truncate(JSON.stringify(document), 256)}</code>
      </Tag>
    </Wrapper>
  );
};
