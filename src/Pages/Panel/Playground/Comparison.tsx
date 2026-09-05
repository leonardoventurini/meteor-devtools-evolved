import React from 'react'
import { observer } from 'mobx-react-lite'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'
import { EvidenceJSON } from './EvidenceJSON'
import styles from './Playground.module.css'

export const Comparison = observer(({ store }: { store: PlaygroundStore }) => {
  let comparison: unknown
  try {
    comparison = store.comparison
  } catch (error) {
    comparison =
      error instanceof Error ? error.message : 'Invalid comparison exclusions.'
  }
  return (
    <section>
      <h2>Compare runs and labeled snapshots</h2>
      <p>
        Compare snapshots captured here or imported from a separately
        authenticated browser profile. Labels describe your test setup; they do
        not establish equivalent permissions. Exclusions are recorded and never
        rewrite evidence.
      </p>
      <div className={styles.grid}>
        {(['comparisonLeft', 'comparisonRight'] as const).map((key, index) => (
          <label key={key}>
            {index === 0 ? 'Baseline snapshot' : 'Comparison snapshot'}
            <select
              value={store[key]}
              onChange={event => store.setField(key, event.target.value)}
            >
              <option value=''>Select run or snapshot</option>
              {store.runs.map(run => (
                <option
                  key={run.request.requestId}
                  value={run.request.requestId}
                >
                  Run · {run.request.sessionLabel} ·{' '}
                  {run.request.operation.name} · {run.phase}
                </option>
              ))}
              {store.snapshots.map(record => (
                <option key={record.id} value={record.id}>
                  {record.request.sessionLabel || 'Unlabeled'} ·{' '}
                  {record.request.operation.name} ·{' '}
                  {new Date(record.capturedAt).toLocaleString()}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {comparison && (
        <EvidenceJSON value={comparison} label='Structured comparison' />
      )}
    </section>
  )
})
