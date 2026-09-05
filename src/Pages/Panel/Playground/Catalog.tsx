import React from 'react'
import { observer } from 'mobx-react-lite'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'
import styles from './Playground.module.css'

export const Catalog = observer(({ store }: { store: PlaygroundStore }) => (
  <section>
    <h2>Observed endpoints</h2>
    <p className={styles.muted}>
      Current page and selected connection only. Up to 500 names and 3 distinct
      recent argument examples each; samples above 4 KiB are omitted. This is
      observed traffic, not complete endpoint enumeration.
    </p>
    <button onClick={store.clearCatalog}>
      Clear catalog for this connection
    </button>
    <ul>
      {store.catalogEntries.map(entry => (
        <li key={`${entry.kind}:${entry.name}`}>
          <strong>
            {entry.kind}: {entry.name}
          </strong>{' '}
          · application observed {entry.applicationCount} · playground generated{' '}
          {entry.playgroundCount} · last seen{' '}
          {new Date(entry.lastSeen).toLocaleTimeString()}
          {entry.examplesOmitted > 0 &&
            ` · ${entry.examplesOmitted} samples omitted`}
          <div className={styles.actions}>
            {entry.examples.map((example, index) => (
              <button
                key={index}
                onClick={() =>
                  store.openDraft(
                    {
                      kind: entry.kind,
                      name: entry.name,
                      parameters: example.parameters,
                    },
                    store.connectionId,
                    store.pageEpoch,
                  )
                }
              >
                Edit example {index + 1} ({example.provenance})
              </button>
            ))}
            <button
              onClick={() =>
                store.openDraft(
                  { kind: entry.kind, name: entry.name, parameters: [] },
                  store.connectionId,
                  store.pageEpoch,
                )
              }
            >
              Compose with empty parameters
            </button>
          </div>
        </li>
      ))}
    </ul>
    {store.catalogEntries.length === 0 && (
      <p>No endpoints observed for this connection yet.</p>
    )}
  </section>
))
