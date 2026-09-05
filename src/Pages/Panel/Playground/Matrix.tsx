import React from 'react'
import { observer } from 'mobx-react-lite'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'
import { EvidenceJSON } from './EvidenceJSON'
import styles from './Playground.module.css'

export const Matrix = observer(({ store }: { store: PlaygroundStore }) => (
  <section>
    <h2>Parameter matrix</h2>
    <p>
      Each candidate changes one JSON Pointer relative to the baseline. The
      reviewed plan deduplicates equal parameters and includes at most 20
      variants. No automatic retries or reconnect resumption.
    </p>
    <details>
      <summary>Candidate format and limits</summary>
      <p>
        Candidate kinds: value, alternate-id, null, missing, wrong-type,
        numeric-boundary, string-boundary. Removing a positional argument is
        allowed only for the trailing argument. A baseline counts toward the
        limit. Exceeding a limit rejects the preview.
      </p>
      <EvidenceJSON
        value={{
          includeBaseline: true,
          changes: [
            {
              path: '/0/id',
              candidates: [
                { kind: 'alternate-id', value: 'another-test-id' },
                { kind: 'null' },
                { kind: 'missing' },
              ],
            },
          ],
        }}
      />
    </details>
    <label>
      Matrix definition (JSON)
      <textarea
        rows={7}
        value={store.matrixText}
        onChange={event => store.setField('matrixText', event.target.value)}
      />
    </label>
    <div className={styles.grid}>
      <label>
        Delay between variants (ms)
        <input
          type='number'
          min={100}
          max={5000}
          value={store.matrixDelayMs}
          onChange={event =>
            store.setField('matrixDelayMs', Number(event.target.value))
          }
        />
      </label>
      <label className={styles.check}>
        <input
          type='checkbox'
          checked={store.continueOnError}
          onChange={event =>
            store.setField('continueOnError', event.target.checked)
          }
        />
        Continue after server error or failed expectation
      </label>
    </div>
    <p className={styles.muted}>
      Concurrency 1. Total elapsed budget 120 seconds. Timeout, interruption,
      context change, truncation, or resource limits always stop the remaining
      queue. Subscription variants capture readiness and release their handles
      before the next starts.
    </p>
    <div className={styles.actions}>
      <button
        disabled={store.matrixRunning}
        onClick={() => void store.attempt(store.previewMatrix)}
      >
        Preview variants
      </button>
      <button
        className={styles.primary}
        disabled={store.matrixPreview.length === 0 || store.matrixRunning}
        onClick={() => void store.attempt(store.startMatrix)}
      >
        Start reviewed matrix
      </button>
      <button disabled={!store.matrixRunning} onClick={store.stopMatrix}>
        Stop matrix
      </button>
    </div>
    {store.matrixPreview.length > 0 && (
      <ol>
        {store.matrixPreview.map((variant, index) => (
          <li key={index}>
            <strong>
              {index + 1}. {variant.label}
            </strong>
            <EvidenceJSON
              value={variant.parameters}
              label={`Variant ${index + 1} parameters`}
            />
          </li>
        ))}
      </ol>
    )}
    {store.matrixProgress && (
      <>
        <p role='status'>
          {store.matrixRunning ? 'Running' : store.matrixProgress.reason}:{' '}
          {store.matrixProgress.outcomes.length} completed /{' '}
          {store.matrixProgress.total}; {store.matrixProgress.started}{' '}
          dispatched.
        </p>
        <ul>
          {store.matrixProgress.outcomes.map(outcome => (
            <li key={outcome.requestId}>
              {outcome.status}{' '}
              <button
                onClick={() =>
                  store.setField('selectedRunId', outcome.requestId)
                }
              >
                Inspect run
              </button>
            </li>
          ))}
        </ul>
      </>
    )}
  </section>
))
