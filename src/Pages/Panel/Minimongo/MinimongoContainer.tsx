import React, { FunctionComponent, useRef } from 'react'
import { List, type RowComponentProps } from 'react-window'
import { observer } from 'mobx-react-lite'
import { usePanelStore } from '@/Stores/PanelStore'
import { MinimongoRow } from '@/Pages/Panel/Minimongo/MinimongoRow'
import { useDimensions } from '@/Utils/Hooks/useDimensions'

interface Props {
  isVisible: boolean
}

interface MinimongoRowProps {
  items: IDocumentWrapper[]
  activeCollection: string | null
  setActiveObject: (document: object) => void
  setActiveCollection: (collectionName: string) => void
}

const Row = ({
  items,
  activeCollection,
  setActiveObject,
  setActiveCollection,
  index,
  style,
}: RowComponentProps<MinimongoRowProps>) => {
  const item = items[index]

  return (
    <MinimongoRow
      style={style}
      item={item}
      onClick={() => setActiveObject(item.document)}
      onCollectionClick={() => setActiveCollection(item.collectionName)}
      isAllVisible={!activeCollection}
    />
  )
}

export const MinimongoContainer: FunctionComponent<Props> = observer(
  ({ isVisible }) => {
    const contentRef = useRef<HTMLDivElement>(null)

    const store = usePanelStore()

    const { activeCollectionDocuments, activeCollection } = store.minimongoStore

    const { width, height } = useDimensions(contentRef, [isVisible])

    return (
      <div className='container' ref={contentRef}>
        <List
          rowCount={activeCollectionDocuments.filtered.length}
          rowHeight={28}
          rowComponent={Row}
          rowProps={{
            items: activeCollectionDocuments.filtered,
            activeCollection,
            setActiveObject: document => store.setActiveObject(document),
            setActiveCollection: collectionName =>
              store.minimongoStore.setActiveCollection(collectionName),
          }}
          style={{ height, width }}
        />
      </div>
    )
  },
)
