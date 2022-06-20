import { usePanelStore } from '@/Stores/PanelStore'
import { Hideable } from '@/Utils/Hideable'
import { observer } from 'mobx-react-lite'
import React, { FunctionComponent } from 'react'
import { DDPContainer } from '@/Pages/Panel/DDP/DDPContainer'
import { BookmarksStatus } from './BookmarksStatus'

interface Props {
  isVisible: boolean
}

export const Bookmarks: FunctionComponent<Props> = observer(({ isVisible }) => {
  const store = usePanelStore()
  const bookmarkStore = store.bookmarkStore

  return (
    <Hideable isVisible={isVisible}>
      <DDPContainer isVisible={isVisible} source={bookmarkStore} />

      <BookmarksStatus />
    </Hideable>
  )
})
