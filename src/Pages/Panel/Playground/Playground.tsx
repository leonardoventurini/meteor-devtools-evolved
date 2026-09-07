import React, { useEffect, useId, useRef } from 'react'
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
import {
  PLAYGROUND_TAB,
  PLAYGROUND_TAB_LABELS,
  type PlaygroundTab,
} from '@/Stores/Panel/PlaygroundTabs'

const TABS = Object.values(PLAYGROUND_TAB)

export const Playground = observer(({ isVisible }: { isVisible: boolean }) => {
  const panel = usePanelStore()
  const store = panel.playgroundStore
  const id = useId()
  const buttons = useRef(new Map<PlaygroundTab, HTMLButtonElement>())
  const activeRuns = store.runs.filter(run => !run.finished).length

  useEffect(() => {
    if (isVisible) void store.attempt(store.loadSaved)
  }, [isVisible, store])
  return (
    <Hideable isVisible={isVisible}>
      <div className={`mde-content ${styles.root}`}>
        <h1>DDP Playground</h1>
        <div
          role='tablist'
          aria-label='Playground sections'
          className={styles.tabs}
        >
          {TABS.map((tab, index) => (
            <button
              key={tab}
              id={`${id}-tab-${tab}`}
              role='tab'
              aria-label={PLAYGROUND_TAB_LABELS[tab]}
              aria-selected={store.activeTab === tab}
              aria-controls={`${id}-panel-${tab}`}
              tabIndex={store.activeTab === tab ? 0 : -1}
              ref={element => {
                if (element) buttons.current.set(tab, element)
                else buttons.current.delete(tab)
              }}
              onClick={() => store.selectTab(tab)}
              onKeyDown={event => {
                let next: PlaygroundTab | undefined

                if (event.key === 'ArrowRight')
                  next = TABS[(index + 1) % TABS.length]
                if (event.key === 'ArrowLeft')
                  next = TABS[(index - 1 + TABS.length) % TABS.length]
                if (event.key === 'Home') next = TABS[0]
                if (event.key === 'End') next = TABS.at(-1)
                if (next) {
                  event.preventDefault()
                  store.selectTab(next)
                  buttons.current.get(next)?.focus()
                }
              }}
            >
              {PLAYGROUND_TAB_LABELS[tab]}
              {tab === PLAYGROUND_TAB.MATRIX &&
                store.matrixRunning &&
                ' · running'}
            </button>
          ))}
        </div>
        {(activeRuns > 0 || store.matrixRunning) && (
          <div className={styles.actions}>
            <span role='status'>
              {activeRuns} active {activeRuns === 1 ? 'run' : 'runs'}
              {store.matrixRunning && ' · matrix running'}
            </span>
            <button onClick={store.stopAll}>
              Stop all playground operations
            </button>
          </div>
        )}
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
        <TransferReview store={store} />
        {TABS.map(tab => (
          <div
            key={tab}
            id={`${id}-panel-${tab}`}
            role='tabpanel'
            aria-labelledby={`${id}-tab-${tab}`}
            hidden={store.activeTab !== tab}
            tabIndex={0}
          >
            {tab === PLAYGROUND_TAB.RUN && (
              <div className={styles.runLayout}>
                <RequestEditor
                  store={store}
                  onSelectConnection={connectionId =>
                    panel.setActiveConnectionId(connectionId)
                  }
                />
                <RunResults store={store} />
              </div>
            )}
            {tab === PLAYGROUND_TAB.COMPARE && <Comparison store={store} />}
            {tab === PLAYGROUND_TAB.MATRIX && <Matrix store={store} />}
            {tab === PLAYGROUND_TAB.CATALOG && <Catalog store={store} />}
            {tab === PLAYGROUND_TAB.SAVED && <SavedRecords store={store} />}
          </div>
        ))}
      </div>
    </Hideable>
  )
})
