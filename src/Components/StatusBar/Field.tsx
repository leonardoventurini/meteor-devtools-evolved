import React, { FunctionComponent } from 'react';
import styled from 'styled-components';

const FieldWrapper = styled.span`
  & + span {
    margin-left: 8px;
  }
`;

export const Field: FunctionComponent = ({ children }) => (
  <FieldWrapper>{children}</FieldWrapper>
);
