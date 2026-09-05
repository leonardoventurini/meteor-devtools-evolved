import React, { type FunctionComponent } from 'react'
import classnames from 'classnames'
import styles from './Separator.module.css'

interface Props {
  horizontal?: boolean
}

export const Separator: FunctionComponent<Props> = ({ horizontal }) => (
  <div
    className={classnames(
      styles.separator,
      horizontal ? styles.horizontal : styles.vertical,
    )}
  />
)
