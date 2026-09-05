import React from 'react'
import { observer } from 'mobx-react-lite'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'
import { EvidenceJSON } from './EvidenceJSON'
import styles from './Playground.module.css'

export const TransferReview = observer(
  ({ store }: { store: PlaygroundStore }) => {
    if (!store.transferPreview) return null
    return (
      <section aria-labelledby='playground-transfer'>
        <h2 id='playground-transfer'>
          Review{' '}
          {['snapshot', 'case'].includes(store.transferKind ?? '')
            ? `${store.transferKind} save`
            : store.transferKind}
        </h2>
        <p>
          Review the exact records below. Known credential fields are masked
          automatically. Inspect arguments, results, documents, labels, endpoint
          hints, and notes for application-specific secrets; add JSON Pointer
          masks before confirming.
        </p>
        <label>
          Additional masks by record ID (JSON)
          <textarea
            rows={4}
            value={store.transferMasksText}
            onChange={event =>
              store.setField('transferMasksText', event.target.value)
            }
          />
        </label>
        <p className={styles.muted}>
          Example: {`{"record-id": ["/operation/parameters/0/secret"]}`}.
          Snapshot argument paths start with /request/operation/parameters;
          evidence paths start with /evidence/data. Masked values remain marked
          as redacted.
        </p>
        <button onClick={() => void store.attempt(store.applyMasks)}>
          Apply masks and refresh preview
        </button>
        <EvidenceJSON
          value={store.transferPreview}
          label='Reviewed transfer preview'
        />
        <div className={styles.actions}>
          <button
            className={styles.primary}
            disabled={store.transferMasksText !== store.transferMasksApplied}
            onClick={() =>
              void store.attempt(async () => {
                const text = await store.confirmTransfer()
                if (text !== undefined) {
                  const url = URL.createObjectURL(
                    new Blob([text], { type: 'application/json' }),
                  )
                  const link = document.createElement('a')
                  link.href = url
                  link.download = 'meteor-devtools-playground.json'
                  link.click()
                  setTimeout(() => URL.revokeObjectURL(url), 1000)
                  store.cancelTransfer()
                }
              })
            }
          >
            Confirm reviewed{' '}
            {['snapshot', 'case'].includes(store.transferKind ?? '')
              ? `${store.transferKind} save`
              : store.transferKind}
          </button>
          <button onClick={store.cancelTransfer}>Cancel preview</button>
        </div>
      </section>
    )
  },
)
