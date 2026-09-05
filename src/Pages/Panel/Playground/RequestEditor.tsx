import React from 'react'
import { observer } from 'mobx-react-lite'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'
import { EvidenceJSON } from './EvidenceJSON'
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
      <h2>Request editor</h2>
      <button onClick={store.newDraft}>New request / case</button>
      <p role='status'>
        {store.sessionReady
          ? 'Inspected page session ready'
          : 'Waiting for inspected page session'}
        {!store.targetConfirmed &&
          ' · Select an explicit target for this draft'}
      </p>
      <div className={styles.grid}>
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
        <label>
          Method or publication name
          <input
            value={store.name}
            onChange={event => store.setField('name', event.target.value)}
            maxLength={256}
          />
        </label>
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
      <p className={styles.muted}>
        Use encoded EJSON, for example {`[{"$date": 0}]`}. Custom EJSON types
        decode only in the inspected application using its registered types.
      </p>
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
      <div className={styles.grid}>
        <label>
          Execution mode
          <select
            value={store.mode}
            onChange={event =>
              store.setField(
                'mode',
                event.target.value as 'application' | 'isolated',
              )
            }
          >
            <option value='application'>
              Application connection · current session
            </option>
            <option value='isolated'>Fresh isolated connection</option>
          </select>
        </label>
        {store.mode === 'isolated' && (
          <label>
            Isolated authentication
            <select
              value={store.isolatedAuthentication}
              onChange={event =>
                store.setField(
                  'isolatedAuthentication',
                  event.target.value as 'anonymous' | 'reuse',
                )
              }
            >
              <option value='anonymous'>Anonymous</option>
              <option value='reuse'>
                Reuse current session explicitly (when supported)
              </option>
            </select>
          </label>
        )}
        <label>
          Session label
          <input
            value={store.sessionLabel}
            maxLength={120}
            onChange={event =>
              store.setField('sessionLabel', event.target.value)
            }
            placeholder='e.g. Account A · project owner'
          />
        </label>
        <label>
          Local wait timeout (ms)
          <input
            type='number'
            min={1000}
            max={60_000}
            value={store.waitMs}
            onChange={event =>
              store.setField('waitMs', Number(event.target.value))
            }
          />
        </label>
      </div>
      {store.mode === 'isolated' && (
        <p className={styles.notice}>
          {store.isolatedAuthentication === 'reuse'
            ? 'Reuse requests an in-memory credential transfer only when the selected connection exposes a verified supported session capability. It fails explicitly when unavailable; no credential is saved or exported.'
            : 'Anonymous isolated connections do not inherit the inspected application login.'}{' '}
          Each isolated run opens a fresh connection to the selected discovered
          endpoint.
        </p>
      )}
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
        <button onClick={store.stopAll}>Stop all playground operations</button>
      </div>
      <details>
        <summary>
          Case metadata, expectations, and comparison exclusions
        </summary>
        <div className={styles.grid}>
          <label>
            Case title
            <input
              value={store.title}
              onChange={event => store.setField('title', event.target.value)}
            />
          </label>
          <label>
            Tags (comma-separated)
            <input
              value={store.tagsText}
              onChange={event => store.setField('tagsText', event.target.value)}
            />
          </label>
        </div>
        <label>
          Notes
          <textarea
            rows={3}
            value={store.notes}
            onChange={event => store.setField('notes', event.target.value)}
          />
        </label>
        <label>
          Declarative expectations (JSON array)
          <textarea
            rows={5}
            value={store.expectationsText}
            onChange={event =>
              store.setField('expectationsText', event.target.value)
            }
          />
        </label>
        <p className={styles.muted}>
          Kinds: outcome, error-code, equals, exists, absent, number-bounds,
          document-count. Missing or redacted evidence yields inconclusive
          results. No scripts run.
        </p>
        <EvidenceJSON
          value={[
            { kind: 'outcome', outcome: 'error' },
            { kind: 'error-code', code: 'not-authorized' },
          ]}
        />
        <label>
          Excluded comparison JSON Pointers (JSON array)
          <textarea
            rows={3}
            value={store.excludedPathsText}
            onChange={event =>
              store.setField('excludedPathsText', event.target.value)
            }
          />
        </label>
      </details>
    </section>
  ),
)
