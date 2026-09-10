import React from 'react'
import { observer } from 'mobx-react-lite'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'
import { EndpointInput } from './EndpointInput'
import styles from './Playground.module.css'

export const RequestEditor = observer(
  ({
    store,
    onSelectConnection,
  }: {
    store: PlaygroundStore
    onSelectConnection: (connectionId: string) => void
  }) => (
    <section>
      <div className={styles.editorHeader}>
        <h2>Request editor</h2>
        <button onClick={store.newDraft}>New request / case</button>
      </div>
      <p role='status'>
        {store.sessionReady
          ? 'Inspected page session ready'
          : 'Waiting for inspected page session'}
        {!store.targetConfirmed &&
          ' · Select an explicit target for this draft'}
      </p>
      <div className={`${styles.grid} ${styles.requestGrid}`}>
        <label>
          Target connection
          <select
            value={store.targetConfirmed ? store.connectionId : ''}
            onChange={event => {
              if (event.target.value) {
                onSelectConnection(event.target.value)
                store.selectConnection(event.target.value)
              }
            }}
          >
            <option value=''>Select an available target</option>
            {store.connections.map(connection => (
              <option key={connection.id} value={connection.id}>
                {connection.displayName} ({connection.id})
              </option>
            ))}
          </select>
        </label>
        <label>
          Operation
          <select
            value={store.kind}
            onChange={event =>
              store.setField(
                'kind',
                event.target.value as 'method' | 'subscription',
              )
            }
          >
            <option value='method'>Method</option>
            <option value='subscription'>Publication subscription</option>
          </select>
        </label>
        <EndpointInput
          key={`${store.pageEpoch}:${store.connectionId}:${store.kind}:${store.targetConfirmed}`}
          store={store}
        />
      </div>
      <label>
        Parameters (encoded EJSON array)
        <textarea
          rows={6}
          spellCheck={false}
          value={store.parametersText}
          onChange={event =>
            store.setField('parametersText', event.target.value)
          }
        />
      </label>
      {store.unresolvedRequestMasks.length > 0 && (
        <div className={styles.notice}>
          <strong>Masked request fields require replacement review</strong>
          <p>
            Restore each missing field in the parameters editor. Null entries
            are redaction placeholders unless you explicitly intend to submit
            null. Editing another field or selecting a target does not resolve
            these masks.
          </p>
          <ul>
            {store.unresolvedRequestMasks.map(path => (
              <li key={path}>{path}</li>
            ))}
          </ul>
          <button onClick={() => void store.attempt(store.resolveRequestMasks)}>
            Use reviewed replacements (including intentional null values)
          </button>
        </div>
      )}
      <p className={styles.muted}>
        {store.mode === 'application'
          ? 'Application connection · current session'
          : `Isolated connection · ${store.isolatedAuthentication === 'reuse' ? 'explicit session reuse' : 'anonymous'}`}
        {' · '}
        {store.sessionLabel}
      </p>
      <div className={styles.actions}>
        <button
          className={styles.primary}
          disabled={
            !store.sessionReady || !store.targetConfirmed || store.matrixRunning
          }
          onClick={() => void store.attempt(store.run)}
        >
          {store.kind === 'method' ? 'Run method' : 'Start publication probe'}
        </button>
        <button onClick={() => void store.attempt(store.saveCase)}>
          Review case to save
        </button>
      </div>
      <p className={styles.muted}>
        Each Run is a fresh invocation and may change application or server
        data.
      </p>
    </section>
  ),
)
