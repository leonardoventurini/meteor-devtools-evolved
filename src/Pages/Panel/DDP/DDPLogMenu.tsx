import { Icon } from '@blueprintjs/core'
import { PanelPage } from '@/Constants'
import { Bridge } from '@/Bridge'
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
      {log.parsedContent?.msg === 'method' && (
        <Icon
          icon='play'
          onClick={() => {
            store.setSelectedTabId(PanelPage.DDP)

            Bridge.sendContentMessage({
              eventType: 'ddp-run-method',
              data: log.parsedContent,
            })
          }}
          style={{ cursor: 'pointer' }}
        />
      )}
    </div>
  )
}
