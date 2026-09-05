import React, { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { usePanelStore } from '@/Stores/PanelStore'
import { Hideable } from '@/Utils/Hideable'
import { RequestEditor } from './RequestEditor'
import { RunResults } from './RunResults'
import { Catalog } from './Catalog'
import { Matrix } from './Matrix'
import { SavedRecords } from './SavedRecords'
import { Comparison } from './Comparison'
import { TransferReview } from './TransferReview'
import styles from './Playground.module.css'

export const Playground = observer(({ isVisible }: { isVisible: boolean }) => {
  const panel = usePanelStore()
  const store = panel.playgroundStore
  useEffect(() => {
    if (isVisible) void store.attempt(store.loadSaved)
  }, [isVisible, store])
  return (
    <Hideable isVisible={isVisible}>
      <div className={`mde-content ${styles.root}`}>
        <h1>DDP Playground</h1>
        <p>
          Edit captured calls or compose methods and publications for this
          inspected page. Every Run is a fresh invocation and may execute client
          stubs or change server data.
        </p>
        {store.error && (
          <p className={styles.error} role='alert'>
            {store.error}
          </p>
        )}
        {store.notice && (
          <p className={styles.notice} role='status'>
            {store.notice}
          </p>
        )}
        <RequestEditor
          store={store}
          onSelectConnection={connectionId =>
            panel.setActiveConnectionId(connectionId)
          }
        />
        <RunResults store={store} />
        <TransferReview store={store} />
        <Matrix store={store} />
        <Catalog store={store} />
        <SavedRecords store={store} />
        <Comparison store={store} />
      </div>
    </Hideable>
  )
})
