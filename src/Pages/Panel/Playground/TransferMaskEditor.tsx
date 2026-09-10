import React, { useState } from 'react'
import { observer } from 'mobx-react-lite'
import {
  parseMaskMap,
  stringifyEditorValue,
  type MaskMap,
} from '@/Playground/EditorModels'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'
import styles from './Playground.module.css'

/* eslint-disable unicorn/no-nested-ternary -- Raw, guided, and invalid are mutually exclusive editor states. */

export const TransferMaskEditor = observer(
  ({ store }: { store: PlaygroundStore }) => {
    const [raw, setRaw] = useState(false)
    const [recordId, setRecordId] = useState('')
    const [path, setPath] = useState('')
    const recordIds = [
      ...(store.transferPreview?.cases.map(record => record.id) ?? []),
      ...(store.transferPreview?.snapshots.map(record => record.id) ?? []),
    ]
    const selectedRecordId = recordIds.includes(recordId)
      ? recordId
      : (recordIds[0] ?? '')
    let masks: MaskMap | undefined
    let parseError = ''

    try {
      masks = parseMaskMap(store.transferMasksText)
    } catch (error) {
      parseError =
        error instanceof Error ? error.message : 'Invalid masks JSON.'
    }

    const write = (next: MaskMap): void =>
      store.setField('transferMasksText', stringifyEditorValue(next))

    return (
      <div aria-labelledby='playground-transfer-masks'>
        <div className={styles.editorHeader}>
          <h3 id='playground-transfer-masks'>Additional redactions</h3>
          <button type='button' onClick={() => setRaw(value => !value)}>
            {raw ? 'Use guided redactions' : 'Edit raw redaction JSON'}
          </button>
        </div>
        <p className={styles.muted}>
          Known credential fields are already masked. Add application-specific
          fields only when the preview contains sensitive data.
        </p>
        {raw ? (
          <label>
            Additional masks by record ID (JSON)
            <textarea
              rows={4}
              spellCheck={false}
              value={store.transferMasksText}
              onChange={event =>
                store.setField('transferMasksText', event.target.value)
              }
            />
          </label>
        ) : masks ? (
          <div className={styles.builder}>
            <div className={styles.grid}>
              <label>
                Record
                <select
                  value={selectedRecordId}
                  onChange={event => setRecordId(event.target.value)}
                >
                  {recordIds.map(id => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                JSON Pointer to redact
                <input
                  value={path}
                  placeholder='/operation/parameters/0/secret'
                  onChange={event => setPath(event.target.value)}
                />
              </label>
            </div>
            <button
              type='button'
              disabled={!selectedRecordId || !path}
              onClick={() => {
                const paths = [
                  ...new Set([...(masks[selectedRecordId] ?? []), path]),
                ]

                write({ ...masks, [selectedRecordId]: paths })
                setPath('')
              }}
            >
              Add redaction
            </button>
            {Object.entries(masks).map(([id, paths]) =>
              paths.map(mask => (
                <div className={styles.builderRow} key={`${id}:${mask}`}>
                  <code>{id}</code>
                  <span>{mask}</span>
                  <button
                    type='button'
                    onClick={() => {
                      const remaining = paths.filter(item => item !== mask)
                      const next = { ...masks }

                      if (remaining.length > 0) next[id] = remaining
                      else delete next[id]
                      write(next)
                    }}
                  >
                    Remove redaction {mask}
                  </button>
                </div>
              )),
            )}
          </div>
        ) : (
          <p className={styles.error} role='alert'>
            {parseError} Open the raw redaction JSON editor to correct it.
          </p>
        )}
        {raw && parseError && (
          <p className={styles.error} role='alert'>
            {parseError}
          </p>
        )}
      </div>
    )
  },
)
