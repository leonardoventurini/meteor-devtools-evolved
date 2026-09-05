import styles from './Minimongo.module.css'
import { MinimongoNavigator } from '@/Pages/Panel/Minimongo/MinimongoNavigator'
import { usePanelStore } from '@/Stores/PanelStore'
import { Hideable } from '@/Utils/Hideable'
import { observer } from 'mobx-react-lite'
import React, { FunctionComponent } from 'react'
import { MinimongoContainer } from '@/Pages/Panel/Minimongo/MinimongoContainer'
import { MinimongoStatus } from '@/Pages/Panel/Minimongo/MinimongoStatus'
import { Button } from '@/Components/Button'
import prettyBytes from 'pretty-bytes'
import { MinimongoQueryDrawer } from './MinimongoQueryDrawer'

interface Props {
  isVisible: boolean
}

export const Minimongo: FunctionComponent<Props> = observer(({ isVisible }) => {
  const { minimongoStore } = usePanelStore()

  const isActiveCollectionMissing =
    minimongoStore.activeCollection &&
    !(minimongoStore.activeCollection in minimongoStore.collections)

  if (isActiveCollectionMissing) {
    minimongoStore.setActiveCollection(null)
  }

  return (
    <Hideable isVisible={isVisible}>
      <div className={'mde-content'}>
        <div className={styles.root}>
          <div className={styles.sidebar}>
            <nav>
              {minimongoStore.collectionNames.length > 0 &&
                minimongoStore.collectionNames.map(key => (
                  <Button
                    key={key}
                    active={minimongoStore.activeCollection === key}
                    onClick={() => minimongoStore.setActiveCollection(key)}
                    subtitle={`${
                      minimongoStore.getMetadata(key)?.collectionSizePretty
                    } (${minimongoStore.collections[key]?.length ?? 0})`}
                    title={key}
                  >
                    {key}
                  </Button>
                ))}

              <Button
                active={!minimongoStore.activeCollection}
                onClick={() => minimongoStore.setActiveCollection(null)}
                subtitle={`${prettyBytes(minimongoStore.totalSize)} (${
                  minimongoStore.totalDocuments
                })`}
              >
                All Documents
              </Button>
            </nav>
          </div>
          <MinimongoContainer isVisible={isVisible} />
        </div>
      </div>

      <MinimongoStatus />

      <MinimongoNavigator />
      <MinimongoQueryDrawer />
    </Hideable>
  )
})
