import { StringUtils } from '@/Utils/StringUtils'
import { Tag } from '@blueprintjs/core'
import React, { CSSProperties, FunctionComponent } from 'react'
import styled from 'styled-components'
import { truncate } from '@/Styles/Mixins'
import { JSONUtils } from '@/Utils/JSONUtils'

const Wrapper = styled.div`
  &,
  & code {
    font-family: monospace;
    font-size: 12px;
  }

  .collection {
    ${truncate};
    cursor: pointer;
    flex: 0 0 auto;
  }

  .preview {
    ${truncate};
    flex: 0 1 auto;
  }

  .document-id {
    ${truncate};
    flex: 0 1 12rem;
    max-width: 25%;
    padding: 2px 6px;
    border: 0;
    border-radius: 2px;
    color: inherit;
    background: rgba(138, 155, 168, 0.15);
    cursor: copy;
    text-align: left;
  }
`

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
    <Wrapper className='row' style={style}>
      {isAllVisible && (
        <Tag
          className='collection'
          style={{ cursor: 'pointer' }}
          minimal
          onClick={() => onCollectionClick()}
        >
          {item.collectionName}
        </Tag>
      )}
      <button
        aria-label={`Copy document ID ${documentId}`}
        className='document-id'
        onClick={() => StringUtils.toClipboard(documentId)}
        title='Copy document ID'
        type='button'
      >
        <code>{documentId}</code>
      </button>
      <Tag className='preview' minimal interactive onClick={() => onClick()}>
        <code>{StringUtils.truncate(item._string, 256)}</code>
      </Tag>
    </Wrapper>
  )
}
