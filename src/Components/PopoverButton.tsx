import React, { type CSSProperties, type FunctionComponent } from 'react'
import { IconName, PopoverNext, type PopoverNextProps } from '@blueprintjs/core'
import { Button } from '@/Components/Button'
import styles from './PopoverButton.module.css'

interface Props extends PopoverNextProps {
  icon: IconName
  height?: number
}

interface PopoverButtonStyle extends CSSProperties {
  '--mde-popover-button-height': string
}

export const PopoverButton: FunctionComponent<Props> = ({
  icon,
  children,
  height = 28,
  ...rest
}) => {
  const style: PopoverButtonStyle = {
    '--mde-popover-button-height': `${height}px`,
  }

  return (
    <span className={styles.wrapper} style={style}>
      <PopoverNext {...rest}>
        <Button icon={icon} className={styles.button}>
          {children}
        </Button>
      </PopoverNext>
    </span>
  )
}
