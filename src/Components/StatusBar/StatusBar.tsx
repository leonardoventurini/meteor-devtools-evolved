import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { NAVBAR_HEIGHT } from '@/Styles/Constants';
import { lighten } from 'polished';

const backgroundColor = '#202b33';

const StatusBarWrapper = styled.div`
  display: flex;
  box-sizing: border-box;
  flex-direction: row;
  height: ${NAVBAR_HEIGHT}px;
  width: 100%;
  border-bottom: 1px solid ${lighten(0.1, backgroundColor)};

  background-color: ${backgroundColor};

  .right-menu {
    display: flex;
    flex-direction: row;
    margin-left: auto;

    button.menu-item {
      &:hover {
        background-color: ${lighten(0.05, backgroundColor)};
      }
    }
  }

  & > * + * {
    margin-left: 8px;
  }
`;

export const StatusBar: FunctionComponent = ({ children }) => (
  <StatusBarWrapper>{children}</StatusBarWrapper>
);
