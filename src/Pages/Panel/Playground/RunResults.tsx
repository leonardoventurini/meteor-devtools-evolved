import React from 'react'
import { observer } from 'mobx-react-lite'
import { toJS } from 'mobx'
import { evaluateExpectation } from '@/Playground/Evidence'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'
import { EvidenceJSON } from './EvidenceJSON'
import styles from './Playground.module.css'

export const RunResults = observer(({ store }: { store: PlaygroundStore }) => {
  const run = store.selectedRun
  let expectations: unknown
  try {
    expectations =
      run &&
      store.expectations.map(expectation => ({
        expectation,
        ...evaluateExpectation(toJS(run.evidence), expectation),
      }))
  } catch (error) {
    expectations =
      error instanceof Error ? error.message : 'Invalid expectations.'
  }
  return (
    <section aria-labelledby='playground-results'>
      <h2 id='playground-results'>Runs and results</h2>
      <p className={styles.muted}>
        History is local to this panel and bounded to 100 runs / 20 MiB. Save an
        immutable snapshot to retain evidence across sessions.
      </p>
      <label>
        Run history
        <select
          value={store.selectedRunId}
          onChange={event =>
            store.setField('selectedRunId', event.target.value)
          }
        >
          <option value=''>Select a run</option>
          {store.runs.map(item => (
            <option key={item.request.requestId} value={item.request.requestId}>
              {new Date(item.startedAt).toLocaleTimeString()} ·{' '}
              {item.request.operation.name} · {item.phase} ·{' '}
              {item.request.sessionLabel}
            </option>
          ))}
        </select>
      </label>
      {run && (
        <>
          <p>
            <strong>{run.request.operation.name}</strong> · {run.phase} ·{' '}
            {run.endpointLabel} · {run.request.mode} /{' '}
            {run.request.authentication}
          </p>
          <p>
            Session: {run.request.sessionLabel} · observed authentication:{' '}
            {run.authentication.state} · {run.authentication.provenance}
          </p>
          <p>
            Started {new Date(run.startedAt).toLocaleString()} · elapsed{' '}
            {Math.max(0, run.updatedAt - run.startedAt)} ms
          </p>
          {run.method && (
            <p>
              Server result:{' '}
              {run.method.resultSeen ? 'received' : 'not received'} · writes
              reflected: {run.method.writesReflected ? 'yes' : 'not confirmed'}{' '}
              · wire ID: {run.method.methodId ?? 'not dispatched'}
              {run.method.lateEvidence
                ? ' · Late evidence after local waiting ended'
                : ''}
            </p>
          )}
          {run.request.operation.kind === 'subscription' && (
            <p className={styles.notice}>
              {run.request.mode === 'application'
                ? 'Shared connection changes may include data from application subscriptions. They cannot establish which publication returned a document.'
                : 'This connection isolates the probe from application subscriptions. Unnamed ambient publications can still contribute data.'}{' '}
              Baseline: {run.evidence.documentBaseline}. Capture boundary:{' '}
              {run.evidence.boundary ?? 'live'}.
            </p>
          )}
          {run.reasons.length > 0 && (
            <ul>
              {run.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          )}
          <div className={styles.actions}>
            <button
              disabled={run.finished}
              onClick={() => store.stop(run.request.requestId)}
            >
              Stop local waiting
            </button>
            {run.request.operation.kind === 'subscription' && (
              <button
                disabled={run.finished}
                onClick={() => store.snapshot(run.request.requestId)}
              >
                Capture current documents
              </button>
            )}
            <button onClick={() => void store.attempt(store.previewSnapshot)}>
              Review snapshot to save
            </button>
            {run.readiness && (
              <button
                onClick={() =>
                  void store.attempt(() => store.previewSnapshot('readiness'))
                }
              >
                Review readiness snapshot to save
              </button>
            )}
          </div>
          <p className={styles.muted}>
            Stopping cannot undo server effects. A dispatched method may
            complete after local waiting stops.
          </p>
          <details>
            <summary>Exact submitted request and context</summary>
            <EvidenceJSON value={run.request} label='Submitted request' />
          </details>
          <EvidenceJSON value={run.evidence} label='Run evidence' />
          {run.readiness && (
            <details>
              <summary>Immutable readiness capture</summary>
              <EvidenceJSON value={run.readiness} label='Readiness evidence' />
            </details>
          )}
          {run.baseline && (
            <details>
              <summary>Before-subscription baseline</summary>
              <EvidenceJSON value={run.baseline} />
            </details>
          )}
          <details>
            <summary>Declarative expectation results</summary>
            <EvidenceJSON value={expectations} />
          </details>
        </>
      )}
    </section>
  )
})
