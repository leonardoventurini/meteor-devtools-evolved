import styles from './Button.module.css'
import React, { ButtonHTMLAttributes, ReactElement, forwardRef } from 'react'
import { Icon, IconName, Intent } from '@blueprintjs/core'
import classnames from 'classnames'
import { isNumber, isString } from 'lodash'
import { PopoverNext } from '@blueprintjs/core'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconName | ReactElement
  intent?: Intent
  shine?: boolean
  active?: boolean
  subtitle?: string
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    icon,
    children,
    intent,
    className,
    shine,
    active,
    subtitle,
    title,
    ...rest
  },
  ref,
) {
  const classes = classnames(
    styles.buttonWrapper,
    {
      shine,
      active,
      warning: intent === 'warning',
    },
    className,
    'h-full',
  )

  const button = (
    <button className={classes} ref={ref} {...rest}>
      <div className={styles.inner}>
        {icon &&
          (isString(icon) ? (
            <Icon icon={icon} className={styles.icon} size={12} />
          ) : (
            icon
          ))}
        {(children || isNumber(children)) && (
          <span className={classnames(styles.content, 'content')}>
            {children}
          </span>
        )}
        {(subtitle || isNumber(subtitle)) && (
          <span className={styles.subtitle}>{subtitle}</span>
        )}
      </div>
    </button>
  )

  return title ? (
    <PopoverNext
      content={<div className='p-4'>{title}</div>}
      interactionKind='hover'
      className='inline-flex items-center'
    >
      {button}
    </PopoverNext>
  ) : (
    button
  )
})
