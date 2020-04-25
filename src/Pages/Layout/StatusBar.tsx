import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { BACKGROUND_COLOR, STATUS_HEIGHT } from '@/Styles/Constants';

const StatusBarWrapper = styled.div`
  background-color: ${BACKGROUND_COLOR};
  position: absolute;
  bottom: -${STATUS_HEIGHT};
  left: 0;
  right: 0;

  padding: 15px;

  display: flex;
  justify-content: flex-end;
  align-items: center;

  .filter-controls {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-right: auto;

    label {
      margin-bottom: 0;
    }

    & > * + * {
      margin-left: 8px;
    }
  }
`;

export const StatusBar: FunctionComponent = ({ children }) => (
  <StatusBarWrapper>{children}</StatusBarWrapper>
);
