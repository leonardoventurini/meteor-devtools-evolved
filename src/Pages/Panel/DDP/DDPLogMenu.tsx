import { Icon } from '@blueprintjs/core'
import { PanelPage } from '@/Constants'
import { parseParameters } from '@/Playground/Values'
import React, { FunctionComponent } from 'react'
import { usePanelStore } from '@/Stores/PanelStore'

interface Props {
  log: DDPLog
}

export const DDPLogMenu: FunctionComponent<Props> = ({ log }) => {
  const store = usePanelStore()

  return (
    <div className='menu invisible flex flex-row gap-2 group-hover:visible'>
      <Icon
        icon='eye-open'
        onClick={() => log.trace && store.setActiveStackTrace(log.trace)}
        style={{ cursor: 'pointer' }}
      />
      <Icon
        icon={
          store.bookmarkStore.bookmarkIds.includes(log.id)
            ? 'star'
            : 'star-empty'
        }
        onClick={() =>
          store.bookmarkStore.bookmarkIds.includes(log.id)
            ? store.bookmarkStore.remove(log)
            : store.bookmarkStore.add(log)
        }
        style={{ cursor: 'pointer' }}
      />
      {(log.parsedContent?.msg === 'method' ||
        log.parsedContent?.msg === 'sub') && (
        <button
          type='button'
          title='Edit in DDP Playground'
          aria-label='Edit in DDP Playground'
          onClick={() => {
            void store.playgroundStore.attempt(() => {
              const content: unknown = JSON.parse(log.content)
              if (!content || typeof content !== 'object')
                throw new Error('Captured parameters are unavailable.')
              const kind =
                log.parsedContent?.msg === 'method' ? 'method' : 'subscription'
              const name =
                kind === 'method'
                  ? log.parsedContent?.method
                  : log.parsedContent?.name
              if (!name)
                throw new Error('Captured endpoint name is unavailable.')
              if (
                log.pageEpoch === store.playgroundStore.pageEpoch &&
                store.connections.some(
                  connection => connection.id === log.connectionId,
                )
              )
                store.setActiveConnectionId(log.connectionId)
              store.playgroundStore.openDraft(
                {
                  kind,
                  name,
                  parameters: parseParameters(
                    JSON.stringify('params' in content ? content.params : []),
                  ),
                },
                log.connectionId,
                log.pageEpoch,
              )
              store.setSelectedTabId(PanelPage.PLAYGROUND)
            })
          }}
        >
          <Icon icon='edit' />
        </button>
      )}
    </div>
  )
}
