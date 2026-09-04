import { Icon, Menu, MenuItem, PopoverNext } from '@blueprintjs/core'
import React, {
  FunctionComponent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { Button } from '@/Components/Button'
import {
  findConnectionByPrefix,
  getAdjacentConnectionId,
  resolveActiveConnectionId,
} from './ConnectionSelectorModel'

const TYPEAHEAD_RESET_DELAY_MS = 500

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
  const [focusedConnectionId, setFocusedConnectionId] =
    useState(activeConnectionId)
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuItemRefs = useRef(new Map<string, HTMLLIElement>())
  const typeaheadBuffer = useRef('')
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const resolvedActiveConnectionId = resolveActiveConnectionId(
    connections,
    activeConnectionId,
  )
  const activeConnection = connections.find(
    connection => connection.id === resolvedActiveConnectionId,
  )
  const activeLabel = activeConnection?.displayName ?? 'No connections'

  useEffect(() => {
    if (
      resolvedActiveConnectionId &&
      resolvedActiveConnectionId !== activeConnectionId
    ) {
      onChange(resolvedActiveConnectionId)
    }
  }, [activeConnectionId, onChange, resolvedActiveConnectionId])

  useEffect(
    () => () => {
      if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current)
    },
    [],
  )

  useEffect(() => {
    if (!isOpen) return

    menuItemRefs.current
      .get(focusedConnectionId)
      ?.querySelector<HTMLElement>('a')
      ?.focus()
  }, [focusedConnectionId, isOpen])

  const selectConnection = useCallback(
    (connectionId: string) => {
      onChange(connectionId)
      setIsOpen(false)
      triggerRef.current?.focus()
    },
    [onChange],
  )

  const closeMenu = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const focusedId = focusedConnectionId || resolvedActiveConnectionId || ''
    let nextConnectionId: string | undefined

    switch (event.key) {
      case 'ArrowDown': {
        nextConnectionId = getAdjacentConnectionId(connections, focusedId, 1)
        break
      }
      case 'ArrowUp': {
        nextConnectionId = getAdjacentConnectionId(connections, focusedId, -1)
        break
      }
      case 'Home': {
        nextConnectionId = connections[0]?.id
        break
      }
      case 'End': {
        nextConnectionId = connections.at(-1)?.id
        break
      }
      case 'Enter':
      case ' ': {
        if (focusedId) selectConnection(focusedId)
        event.preventDefault()
        return
      }
      case 'Escape': {
        closeMenu()
        event.preventDefault()
        return
      }
      default: {
        if (
          event.key.length === 1 &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey
        ) {
          typeaheadBuffer.current += event.key
          nextConnectionId = findConnectionByPrefix(
            connections,
            focusedId,
            typeaheadBuffer.current,
          )

          if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current)
          typeaheadTimer.current = setTimeout(() => {
            typeaheadBuffer.current = ''
          }, TYPEAHEAD_RESET_DELAY_MS)
        }
      }
    }

    if (nextConnectionId) {
      setFocusedConnectionId(nextConnectionId)
      event.preventDefault()
    }
  }

  return (
    <PopoverNext
      className='mde-connection-selector'
      content={
        <Menu
          aria-label='Meteor DDP connections'
          id={menuId}
          onKeyDown={handleMenuKeyDown}
          role='listbox'
          style={{ minWidth: '9rem', maxWidth: '24rem' }}
        >
          {connections.map(connection => (
            <MenuItem
              active={connection.id === focusedConnectionId}
              autoFocus={connection.id === focusedConnectionId}
              key={connection.id}
              onClick={() => selectConnection(connection.id)}
              onFocus={() => setFocusedConnectionId(connection.id)}
              ref={element => {
                if (element) menuItemRefs.current.set(connection.id, element)
                else menuItemRefs.current.delete(connection.id)
              }}
              roleStructure='listoption'
              selected={connection.id === resolvedActiveConnectionId}
              text={connection.displayName}
            />
          ))}
        </Menu>
      }
      isOpen={isOpen}
      onInteraction={nextIsOpen => {
        setIsOpen(nextIsOpen)

        if (nextIsOpen && resolvedActiveConnectionId) {
          setFocusedConnectionId(resolvedActiveConnectionId)
        }
      }}
      placement='bottom-end'
    >
      <Button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        aria-label={`Meteor DDP connection: ${activeLabel}`}
        className='mde-connection-trigger'
        disabled={connections.length === 0}
        ref={triggerRef}
      >
        <span className='mde-connection-trigger-content'>
          <span className='mde-connection-label'>{activeLabel}</span>
          <Icon icon='caret-down' size={14} />
        </span>
      </Button>
    </PopoverNext>
  )
}
