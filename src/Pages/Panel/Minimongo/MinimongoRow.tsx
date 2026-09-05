import styles from './MinimongoRow.module.css'
import { StringUtils } from '@/Utils/StringUtils'
import { Tag } from '@blueprintjs/core'
import React, { CSSProperties, FunctionComponent } from 'react'
import { JSONUtils } from '@/Utils/JSONUtils'

export const formatDocumentId = (id: unknown): string => {
  if (id === undefined) return '(no _id)'
  if (typeof id === 'string') return id

  return JSONUtils.stringify(id) ?? String(id)
}

interface Props {
  item: IDocumentWrapper
  style: CSSProperties
  onClick: () => void
  onCollectionClick: () => void
  isAllVisible: boolean
}

export const MinimongoRow: FunctionComponent<Props> = ({
  item,
  style,
  onClick,
  onCollectionClick,
  isAllVisible,
}) => {
  const documentId = formatDocumentId(item.document._id)

  return (
    <div className={`row ${styles.root}`} style={style}>
      {isAllVisible && (
        <Tag
          className={styles.collection}
          style={{ cursor: 'pointer' }}
          minimal
          onClick={() => onCollectionClick()}
        >
          {item.collectionName}
        </Tag>
      )}
      <button
        aria-label={`Copy document ID ${documentId}`}
        className={styles.documentId}
        onClick={() => StringUtils.toClipboard(documentId)}
        title='Copy document ID'
        type='button'
      >
        <code>{documentId}</code>
      </button>
      <Tag
        className={styles.preview}
        minimal
        interactive
        onClick={() => onClick()}
      >
        <code>{StringUtils.truncate(item._string, 256)}</code>
      </Tag>
    </div>
  )
}
