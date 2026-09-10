import React, { useState } from 'react'
import { observer } from 'mobx-react-lite'
import {
  MATRIX_CANDIDATE_KINDS,
  createMatrixCandidate,
  stringifyEditorValue,
  type MatrixCandidateKind,
} from '@/Playground/EditorModels'
import type { MatrixCandidate, MatrixDefinition } from '@/Playground/Matrix'
import { parsePointer } from '@/Playground/Pointer'
import { parseMatrixDefinition } from '@/Playground/Records'
import { validateValue, type EncodedValue } from '@/Playground/Values'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'
import styles from './Playground.module.css'

/* eslint-disable unicorn/no-nested-ternary -- Raw, guided, and invalid are mutually exclusive editor states. */

const candidateLabel: Record<MatrixCandidateKind, string> = {
  value: 'Specific value',
  'alternate-id': 'Alternate ID',
  null: 'Null',
  missing: 'Missing field',
  'wrong-type': 'Common wrong types',
  'numeric-boundary': 'Numeric boundary',
  'string-boundary': 'String length boundary',
}

const JsonCandidateValue = ({
  value,
  onCommit,
}: {
  value: unknown
  onCommit: (value: EncodedValue) => void
}) => {
  const [draft, setDraft] = useState(() => stringifyEditorValue(value))
  const [error, setError] = useState('')

  return (
    <div className={styles.inlineEditor}>
      <label>
        Candidate value (encoded EJSON)
        <textarea
          rows={2}
          spellCheck={false}
          value={draft}
          onChange={event => setDraft(event.target.value)}
        />
      </label>
      <button
        onClick={() => {
          try {
            const next: unknown = JSON.parse(draft)

            validateValue(next)
            onCommit(next)
            setError('')
          } catch {
            setError('Enter one valid encoded EJSON value.')
          }
        }}
      >
        Apply value
      </button>
      {error && (
        <span className={styles.error} role='alert'>
          {error}
        </span>
      )}
    </div>
  )
}

const MatrixPathInput = ({
  index,
  path,
  onCommit,
}: {
  index: number
  path: string
  onCommit: (path: string) => void
}) => {
  const [draft, setDraft] = useState(path)
  const [error, setError] = useState('')

  const commit = (): void => {
    try {
      parsePointer(draft)
      if (!draft) throw new TypeError('A non-root JSON Pointer is required.')
      onCommit(draft)
      setError('')
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : 'Invalid JSON Pointer.',
      )
    }
  }

  return (
    <label>
      Parameter JSON Pointer
      <input
        aria-label={`Parameter change ${index + 1} JSON Pointer`}
        value={draft}
        placeholder='/0/id'
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
      />
      {error && (
        <span className={styles.error} role='alert'>
          {error}
        </span>
      )}
    </label>
  )
}

export const MatrixEditor = observer(
  ({ store }: { store: PlaygroundStore }) => {
    const [raw, setRaw] = useState(false)
    let definition: MatrixDefinition | undefined
    let parseError = ''

    try {
      definition = parseMatrixDefinition(JSON.parse(store.matrixText), [], true)
    } catch (error) {
      parseError =
        error instanceof Error ? error.message : 'Invalid matrix definition.'
    }

    const save = (next: MatrixDefinition): void =>
      store.setField('matrixText', stringifyEditorValue(next))
    const updateCandidate = (
      changeIndex: number,
      candidateIndex: number,
      candidate: MatrixCandidate,
    ): void => {
      if (!definition) return

      save({
        ...definition,
        changes: definition.changes.map((change, index) =>
          index === changeIndex
            ? {
                ...change,
                candidates: change.candidates.map((item, position) =>
                  position === candidateIndex ? candidate : item,
                ),
              }
            : change,
        ),
      })
    }

    return (
      <div>
        <div className={styles.actions}>
          <button onClick={() => setRaw(value => !value)}>
            {raw ? 'Use guided matrix builder' : 'Edit raw matrix JSON'}
          </button>
        </div>
        {raw ? (
          <label>
            Matrix definition (JSON)
            <textarea
              rows={7}
              spellCheck={false}
              value={store.matrixText}
              onChange={event =>
                store.setField('matrixText', event.target.value)
              }
            />
          </label>
        ) : definition ? (
          <div className={styles.builder}>
            <label className={styles.check}>
              <input
                type='checkbox'
                checked={definition.includeBaseline}
                onChange={event =>
                  save({ ...definition, includeBaseline: event.target.checked })
                }
              />
              Include the original parameters
            </label>
            {definition.changes.map((change, changeIndex) => (
              <fieldset key={changeIndex}>
                <legend>Parameter change {changeIndex + 1}</legend>
                <MatrixPathInput
                  key={change.path}
                  index={changeIndex}
                  path={change.path}
                  onCommit={path =>
                    save({
                      ...definition,
                      changes: definition.changes.map((item, index) =>
                        index === changeIndex ? { ...item, path } : item,
                      ),
                    })
                  }
                />
                {change.candidates.map((candidate, candidateIndex) => (
                  <div className={styles.builderRow} key={candidateIndex}>
                    <label>
                      Candidate {candidateIndex + 1}
                      <select
                        value={candidate.kind}
                        onChange={event =>
                          updateCandidate(
                            changeIndex,
                            candidateIndex,
                            createMatrixCandidate(
                              event.target.value as MatrixCandidateKind,
                            ),
                          )
                        }
                      >
                        {MATRIX_CANDIDATE_KINDS.map(kind => (
                          <option key={kind} value={kind}>
                            {candidateLabel[kind]}
                          </option>
                        ))}
                      </select>
                    </label>
                    {(candidate.kind === 'value' ||
                      candidate.kind === 'alternate-id') && (
                      <JsonCandidateValue
                        key={stringifyEditorValue(candidate.value)}
                        value={candidate.value}
                        onCommit={value =>
                          updateCandidate(changeIndex, candidateIndex, {
                            kind: candidate.kind,
                            value,
                          })
                        }
                      />
                    )}
                    {candidate.kind === 'numeric-boundary' && (
                      <label>
                        Boundary
                        <input
                          type='number'
                          value={candidate.boundary}
                          onChange={event =>
                            updateCandidate(changeIndex, candidateIndex, {
                              kind: candidate.kind,
                              boundary: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                    )}
                    {candidate.kind === 'string-boundary' && (
                      <label>
                        Boundary length
                        <input
                          type='number'
                          min={0}
                          value={candidate.length}
                          onChange={event =>
                            updateCandidate(changeIndex, candidateIndex, {
                              kind: candidate.kind,
                              length: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                    )}
                    <button
                      onClick={() =>
                        save({
                          ...definition,
                          changes: definition.changes.map((item, index) =>
                            index === changeIndex
                              ? {
                                  ...item,
                                  candidates: item.candidates.filter(
                                    (_, position) =>
                                      position !== candidateIndex,
                                  ),
                                }
                              : item,
                          ),
                        })
                      }
                    >
                      Remove candidate {candidateIndex + 1}
                    </button>
                  </div>
                ))}
                <div className={styles.actions}>
                  <button
                    onClick={() =>
                      save({
                        ...definition,
                        changes: definition.changes.map((item, index) =>
                          index === changeIndex
                            ? {
                                ...item,
                                candidates: [
                                  ...item.candidates,
                                  createMatrixCandidate('value'),
                                ],
                              }
                            : item,
                        ),
                      })
                    }
                  >
                    Add candidate
                  </button>
                  <button
                    onClick={() =>
                      save({
                        ...definition,
                        changes: definition.changes.filter(
                          (_, index) => index !== changeIndex,
                        ),
                      })
                    }
                  >
                    Remove parameter change {changeIndex + 1}
                  </button>
                </div>
              </fieldset>
            ))}
            <button
              onClick={() =>
                save({
                  ...definition,
                  changes: [
                    ...definition.changes,
                    {
                      path: '/0',
                      candidates: [createMatrixCandidate('value')],
                    },
                  ],
                })
              }
            >
              Add parameter change
            </button>
          </div>
        ) : (
          <p className={styles.error} role='alert'>
            {parseError} Open the raw JSON editor to correct it.
          </p>
        )}
      </div>
    )
  },
)
