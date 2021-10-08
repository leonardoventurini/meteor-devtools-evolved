import React, { FunctionComponent } from 'react'
import styled from 'styled-components'
import { NAVBAR_HEIGHT } from '@/Styles/Constants'
import { lighten } from 'polished'
import { centerItems } from '@/Styles/Mixins'

const backgroundColor = '#202b33'

const Wrapper = styled.div`
  user-select: none;
  display: flex;
  box-sizing: border-box;
  flex-direction: row;
  height: ${NAVBAR_HEIGHT}px;
  width: 100%;

  background-color: ${backgroundColor};

  button {
    height: 100%;
    flex: 1 1 auto;

    &:hover {
      background-color: ${lighten(0.05, backgroundColor)};
    }
  }

  .left-group,
  .right-group {
    ${centerItems};
  }

  .right-group {
    margin-left: auto;
  }

  & > * + * {
    margin-left: 8px;
  }
`

export const StatusBar: FunctionComponent = ({ children }) => (
  <Wrapper>{children}</Wrapper>
)
