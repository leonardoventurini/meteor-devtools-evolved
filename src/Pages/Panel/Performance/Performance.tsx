import React, { PropsWithChildren } from 'react'
import { Hideable } from '@/Utils/Hideable'

type Props = { isVisible: boolean }

export function Performance({ children, isVisible }: PropsWithChildren<Props>) {
  return (
    <Hideable isVisible={isVisible}>
      <div className='mde-content'>Hello World</div>
    </Hideable>
  )
}
