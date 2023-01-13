import React, { FunctionComponent } from 'react'
import { IconName } from '@blueprintjs/core'
import { Button } from '@/Components/Button'
import styled from 'styled-components'
import { Popover2, Popover2Props } from '@blueprintjs/popover2'

interface WrapperProps {
  height: number
}

const Wrapper = styled.span`
  button.popover-button {
    display: inline-block;
    height: ${(props: WrapperProps) => props.height}px;
  }
`

interface Props extends Popover2Props {
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
    <Popover2 {...rest}>
      <Button icon={icon} className='popover-button'>
        {children}
      </Button>
    </Popover2>
  </Wrapper>
)
