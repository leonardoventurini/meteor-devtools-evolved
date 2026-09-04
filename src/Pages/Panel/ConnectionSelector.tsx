import { Icon, Menu, MenuItem, PopoverNext } from '@blueprintjs/core'
import React, { FunctionComponent, useId, useState } from 'react'
import { Button } from '@/Components/Button'

interface Props {
  activeConnectionId: string
  connections: ConnectionSummary[]

  onChange(connectionId: string): void
}

export const ConnectionSelector: FunctionComponent<Props> = ({
  activeConnectionId,
  connections,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const activeConnection = connections.find(
    connection => connection.id === activeConnectionId,
  )
  const activeLabel = activeConnection?.displayName ?? activeConnectionId

  return (
    <PopoverNext
      className='mde-connection-selector'
      content={
        <Menu id={menuId} style={{ minWidth: '9rem', maxWidth: '24rem' }}>
          {connections.map(connection => (
            <MenuItem
              active={connection.id === activeConnectionId}
              icon={connection.id === activeConnectionId ? 'tick' : 'blank'}
              key={connection.id}
              onClick={() => {
                onChange(connection.id)
                setIsOpen(false)
              }}
              text={connection.displayName}
            />
          ))}
        </Menu>
      }
      isOpen={isOpen}
      onInteraction={setIsOpen}
      placement='bottom-end'
    >
      <Button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup='menu'
        aria-label={`Meteor DDP connection: ${activeLabel}`}
        className='mde-connection-trigger'
      >
        <span className='mde-connection-trigger-content'>
          <span className='mde-connection-label'>{activeLabel}</span>
          <Icon icon='caret-down' size={14} />
        </span>
      </Button>
    </PopoverNext>
  )
}
