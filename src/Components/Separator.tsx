import React, { FunctionComponent } from 'react'
import styled from 'styled-components'

interface WrapperProps {
  isHorizontal?: boolean
}

const marginSize = 2

const Wrapper = styled.div`
  width: ${({ isHorizontal }: WrapperProps) =>
    isHorizontal ? `calc(100% - ${marginSize * 2}px)` : '1px'};
  height: ${({ isHorizontal }: WrapperProps) =>
    isHorizontal ? '1px' : `calc(100% - ${marginSize * 2}px)`};
  margin: ${marginSize}px;
  background-color: rgba(255, 255, 255, 0.05);
`

export const Separator: FunctionComponent<WrapperProps> = props => (
  <Wrapper {...props} />
)
