import styles from './StatusBar.module.css'
import React, { FunctionComponent, PropsWithChildren } from 'react'

export const StatusBar: FunctionComponent<PropsWithChildren> = ({
  children,
}) => <div className={styles.wrapper}>{children}</div>
