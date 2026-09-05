import styles from './Field.module.css'
import React, { FunctionComponent, PropsWithChildren } from 'react'
import { Icon, IconName } from '@blueprintjs/core'
import { exists } from '@/Utils'
import classnames from 'classnames'

interface Props {
  icon?: IconName
  intent?: 'warning'
  className?: string
}

export const Field: FunctionComponent<PropsWithChildren<Props>> = ({
  children,
  icon,
  className,
  intent,
}) => {
  const classes = classnames(
    styles.wrapper,
    {
      warning: intent === 'warning',
    },
    className,
  )

  return (
    <span className={classes}>
      {icon && <Icon icon={icon} className={styles.icon} size={12} />}
      {exists(children) && <span>{children}</span>}
    </span>
  )
}
