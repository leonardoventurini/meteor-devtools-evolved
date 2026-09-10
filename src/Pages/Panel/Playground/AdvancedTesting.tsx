import React from 'react'
import { observer } from 'mobx-react-lite'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'
import { ExpectationEditor } from './ExpectationEditor'
import { Matrix } from './Matrix'
import styles from './Playground.module.css'

export const AdvancedTesting = observer(
  ({ store }: { store: PlaygroundStore }) => (
    <div className={styles.advancedLayout}>
      <section>
        <h2>Execution and saved-case settings</h2>
        <p className={styles.muted}>
          The defaults use the inspected application's current connection and a
          bounded local wait. Change these only when the test requires a clean
          connection or a labeled comparison.
        </p>
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
              <option value='application'>Current app connection</option>
              <option value='isolated'>Clean isolated connection</option>
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
                  Reuse current session when supported
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
        {store.mode === 'isolated' && (
          <p className={styles.notice}>
            {store.isolatedAuthentication === 'reuse'
              ? 'Session reuse transfers credentials in memory only when the selected connection exposes a verified capability. It fails explicitly when unavailable.'
              : 'A clean anonymous connection does not inherit the inspected application login.'}
          </p>
        )}
        <label>
          Case notes
          <textarea
            rows={3}
            value={store.notes}
            onChange={event => store.setField('notes', event.target.value)}
          />
        </label>
        <ExpectationEditor store={store} />
        <label>
          Excluded comparison JSON Pointers (JSON array)
          <textarea
            rows={3}
            spellCheck={false}
            value={store.excludedPathsText}
            onChange={event =>
              store.setField('excludedPathsText', event.target.value)
            }
          />
        </label>
      </section>
      <Matrix store={store} />
    </div>
  ),
)
