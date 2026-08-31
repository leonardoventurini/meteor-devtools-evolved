import React, { FunctionComponent } from 'react'
import { IconName } from '@blueprintjs/core'
import { Button } from '@/Components/Button'
import styled from 'styled-components'
import { Popover, type PopoverProps } from '@blueprintjs/core'

interface WrapperProps {
  height: number
}

const Wrapper = styled.span<WrapperProps>`
  button.popover-button {
    display: inline-block;
    height: ${(props: WrapperProps) => props.height}px;
  }
`

interface Props extends PopoverProps {
  icon: IconName
  height?: number
}

export const PopoverButton: FunctionComponent<Props> = ({
  icon,
  children,
  height = 28,
  ...rest
}) => (
  <Wrapper height={height}>
    <Popover {...rest}>
      <Button icon={icon} className='popover-button'>
        {children}
      </Button>
    </Popover>
  </Wrapper>
)
