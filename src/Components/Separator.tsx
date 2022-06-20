import React, { FunctionComponent } from 'react'
import styled from 'styled-components'

interface WrapperProps {
  horizontal?: boolean
}

const Wrapper = styled.div`
  width: ${({ horizontal }: WrapperProps) => (horizontal ? undefined : '1px')};
  height: ${({ horizontal }: WrapperProps) => (horizontal ? '1px' : undefined)};
  margin: 0 3px;
  background-color: rgba(0, 0, 0, 0.05);
`

export const Separator: FunctionComponent<WrapperProps> = props => (
  <Wrapper {...props} />
)
