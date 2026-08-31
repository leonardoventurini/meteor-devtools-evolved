import React, { FunctionComponent, useRef } from 'react'
import { DDPLog } from '@/Pages/Panel/DDP/DDPLog'
import { List, type RowComponentProps } from 'react-window'
import { observer } from 'mobx-react-lite'
import { DDPStore } from '@/Stores/Panel/DDPStore'
import { BookmarkStore } from '@/Stores/Panel/BookmarkStore'
import { useDimensions } from '@/Utils/Hooks/useDimensions'
import { usePanelStore } from '@/Stores/PanelStore'

interface Props {
  source: DDPStore | BookmarkStore
  isVisible: boolean
}

interface DDPRowProps {
  items: Array<DDPLog | Bookmark>
  newLogIds: string[]
  bookmarkedLogIds: Array<string | undefined>
}

const Row = observer(
  ({
    items,
    newLogIds,
    bookmarkedLogIds,
    index,
    style,
  }: RowComponentProps<DDPRowProps>) => {
    const item = items[index]
    const log = 'log' in item ? item.log : item

    return (
      <DDPLog
        style={style}
        log={log}
        isNew={newLogIds.includes(log.id)}
        isStarred={bookmarkedLogIds.includes(log.id)}
      />
    )
  },
)

export const DDPContainer: FunctionComponent<Props> = observer(
  ({ source, isVisible }) => {
    const store = usePanelStore()
    const contentRef = useRef<HTMLDivElement>(null)

    const { width, height } = useDimensions(contentRef, [isVisible])

    const list = (
      <List
        rowCount={source.filtered.length}
        rowHeight={28}
        rowComponent={Row}
        rowProps={{
          items: source.filtered,
          newLogIds: 'newLogs' in source ? source.newLogs : [],
          bookmarkedLogIds: store.bookmarkStore.bookmarkIds,
        }}
        style={{ height, width }}
      />
    )

    return (
      <div className='mde-content mde-ddp' ref={contentRef}>
        {source.filtered.length > 0 ? list : null}
      </div>
    )
  },
)
