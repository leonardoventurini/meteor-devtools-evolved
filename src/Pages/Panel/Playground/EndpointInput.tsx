import React, { useEffect, useId, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'
import styles from './EndpointInput.module.css'

export const EndpointInput = observer(
  ({ store }: { store: PlaygroundStore }) => {
    const id = useId()
    const listId = `${id}-suggestions`
    const hintId = `${id}-hint`
    const [open, setOpen] = useState(false)
    const [activeName, setActiveName] = useState<string | null>(null)
    const activeOption = useRef<HTMLLIElement>(null)
    const suggestions = store.endpointSuggestions
    const activeIndex = suggestions.findIndex(
      entry => entry.name === activeName,
    )
    const expanded = open && store.targetConfirmed

    useEffect(() => {
      if (expanded) activeOption.current?.scrollIntoView({ block: 'nearest' })
    }, [activeName, expanded])

    const select = (name: string) => {
      store.selectCatalogEndpoint(name)
      setOpen(false)
      setActiveName(null)
    }

    return (
      <div className={styles.root}>
        <label htmlFor={id}>Method or publication name</label>
        <div className={styles.control}>
          <input
            id={id}
            role='combobox'
            aria-autocomplete='list'
            aria-expanded={expanded}
            aria-controls={expanded ? listId : undefined}
            aria-describedby={hintId}
            aria-activedescendant={
              expanded && activeIndex !== -1
                ? `${id}-option-${activeIndex}`
                : undefined
            }
            autoComplete='off'
            value={store.name}
            maxLength={256}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onBlur={() => {
              setOpen(false)
              setActiveName(null)
            }}
            onChange={event => {
              store.setField('name', event.target.value)
              setActiveName(null)
              setOpen(true)
            }}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                setOpen(false)
                setActiveName(null)
              } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                setOpen(true)

                if (suggestions.length === 0) return

                const previousIndex =
                  activeIndex < 0 ? suggestions.length : activeIndex
                const nextIndex =
                  event.key === 'ArrowDown'
                    ? (activeIndex + 1) % suggestions.length
                    : (previousIndex - 1 + suggestions.length) %
                      suggestions.length

                setActiveName(suggestions[nextIndex]?.name ?? null)
              } else if (
                event.key === 'Enter' &&
                expanded &&
                activeIndex >= 0
              ) {
                event.preventDefault()
                select(suggestions[activeIndex]!.name)
              }
            }}
          />
          {expanded && (
            <div className={styles.popup}>
              <ul
                id={listId}
                role='listbox'
                aria-label='Observed endpoint suggestions'
                className={styles.list}
              >
                {suggestions.map((entry, index) => (
                  <li
                    key={entry.name}
                    id={`${id}-option-${index}`}
                    role='option'
                    aria-selected={index === activeIndex}
                    ref={index === activeIndex ? activeOption : undefined}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => select(entry.name)}
                  >
                    <strong>{entry.name}</strong>
                    <span>
                      {entry.examples.length > 0
                        ? 'Load latest retained arguments'
                        : 'No captured arguments available'}
                    </span>
                  </li>
                ))}
              </ul>
              {suggestions.length === 0 && (
                <p role='status'>
                  No matching observed endpoints. You can enter a name manually.
                </p>
              )}
            </div>
          )}
        </div>
        <small id={hintId}>
          {store.targetConfirmed
            ? 'Search observed endpoints or enter a name. Selecting replaces parameters with the latest retained sample.'
            : 'Select a target connection to see observed endpoints, or enter a name manually.'}
        </small>
      </div>
    )
  },
)
