import React, { type PropsWithChildren } from 'react'
import styles from './PanelLayout.module.css'

/**
 * Owns shell geometry while feature panels retain their state and lifecycle.
 * Existing navigation hooks anchor separately owned controls.
 */
export function PanelLayout({ children }: PropsWithChildren) {
  return <div className={styles.layout}>{children}</div>
}
