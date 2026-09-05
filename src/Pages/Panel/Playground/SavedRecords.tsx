import React, { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { PLAYGROUND_LIMITS } from '@/Playground/Limits'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'
import { EvidenceJSON } from './EvidenceJSON'
import styles from './Playground.module.css'

const toggle = (items: string[], id: string) =>
  items.includes(id) ? items.filter(item => item !== id) : [...items, id]
export const SavedRecords = observer(
  ({ store }: { store: PlaygroundStore }) => {
    const [selectedCases, setSelectedCases] = useState<string[]>([])
    const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([])
    return (
      <section>
        <h2>Saved cases and snapshots</h2>
        <div className={styles.actions}>
          <button onClick={() => void store.attempt(store.loadSaved)}>
            Reload saved records
          </button>
          <button onClick={() => void store.attempt(store.saveCase)}>
            Review case to save
          </button>
          <button
            disabled={
              selectedCases.length === 0 && selectedSnapshots.length === 0
            }
            onClick={() =>
              void store.attempt(() =>
                store.previewExport(selectedCases, selectedSnapshots),
              )
            }
          >
            Review selected export
          </button>
        </div>
        <p className={styles.muted}>
          Cases remain editable. Saved snapshots never change. Imports create
          new local IDs; importing does not execute any request or select an
          authentication session.
        </p>
        {store.storageErrors.map(error => (
          <p className={styles.error} key={error}>
            {error}
          </p>
        ))}
        <h3>Cases</h3>
        <ul>
          {store.cases.map(record => (
            <li key={record.id}>
              <label className={styles.check}>
                <input
                  type='checkbox'
                  checked={selectedCases.includes(record.id)}
                  onChange={() =>
                    setSelectedCases(toggle(selectedCases, record.id))
                  }
                />
                {record.title || record.operation.name} · revision{' '}
                {record.revision}
              </label>
              <div className={styles.actions}>
                <button onClick={() => store.loadCase(record.id)}>
                  Load into editor
                </button>
                <button
                  onClick={() =>
                    void store.attempt(() => store.deleteCase(record.id))
                  }
                >
                  Delete case
                </button>
              </div>
            </li>
          ))}
        </ul>
        <h3>Immutable snapshots</h3>
        <ul>
          {store.snapshots.map(record => (
            <li key={record.id}>
              <label className={styles.check}>
                <input
                  type='checkbox'
                  checked={selectedSnapshots.includes(record.id)}
                  onChange={() =>
                    setSelectedSnapshots(toggle(selectedSnapshots, record.id))
                  }
                />
                {record.request.sessionLabel || 'Unlabeled session'} ·{' '}
                {record.request.operation.name} · {record.outcome} ·{' '}
                {new Date(record.capturedAt).toLocaleString()}
              </label>
              <div className={styles.actions}>
                <button
                  onClick={() => store.setField('comparisonLeft', record.id)}
                >
                  Use as comparison baseline
                </button>
                <button
                  onClick={() => store.setField('comparisonRight', record.id)}
                >
                  Compare with baseline
                </button>
                <button
                  onClick={() =>
                    void store.attempt(() => store.deleteSnapshot(record.id))
                  }
                >
                  Delete snapshot
                </button>
              </div>
              <details>
                <summary>Snapshot metadata and evidence</summary>
                <EvidenceJSON value={record} />
              </details>
            </li>
          ))}
        </ul>
        <label>
          Import playground file
          <input
            type='file'
            accept='.json,application/json'
            onChange={event => {
              const file = event.target.files?.[0]
              if (file)
                void store.attempt(async () => {
                  if (file.size > PLAYGROUND_LIMITS.importBytes)
                    throw new Error('Import exceeds 10 MiB.')
                  store.previewImport(await file.text())
                })
              event.target.value = ''
            }}
          />
        </label>
      </section>
    )
  },
)
