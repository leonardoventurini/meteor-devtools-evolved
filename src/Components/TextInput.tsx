import styles from './TextInput.module.css'
import React, { FunctionComponent, InputHTMLAttributes } from 'react'
import { Icon, IconName } from '@blueprintjs/core'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  icon?: IconName
}

export const TextInput: FunctionComponent<Props> = ({ icon, ...rest }) => (
  <div className={styles.wrapper}>
    <Icon icon={icon} size={12} className={styles.icon} />
    <input type='text' {...rest} />
  </div>
)
