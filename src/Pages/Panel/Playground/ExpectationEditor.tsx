import React, { useState } from 'react'
import { observer } from 'mobx-react-lite'
import type { Expectation } from '@/Playground/Evidence'
import {
  EXPECTATION_KINDS,
  createExpectation,
  stringifyEditorValue,
  type ExpectationKind,
} from '@/Playground/EditorModels'
import { parseExpectation } from '@/Playground/Records'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'
import styles from './Playground.module.css'

const EXPECTATION_LABELS: Record<ExpectationKind, string> = {
  outcome: 'Outcome',
  'error-code': 'Error code',
  equals: 'Value equals',
  exists: 'Value exists',
  absent: 'Value is absent',
  'number-bounds': 'Number bounds',
  'document-count': 'Document count',
}

const parseExpectations = (text: string): Expectation[] => {
  const value: unknown = JSON.parse(text)

  if (!Array.isArray(value))
    throw new TypeError('Expectations must be a JSON array.')

  return value.map(item => parseExpectation(item))
}

interface ExpectationValueEditorProps {
  index: number
  expectation: Extract<Expectation, { kind: 'equals' }>
  onUpdate(expectation: Expectation): void
}

const ExpectationValueEditor = ({
  index,
  expectation,
  onUpdate,
}: ExpectationValueEditorProps) => {
  const [draft, setDraft] = useState(() =>
    stringifyEditorValue(expectation.value),
  )
  const [error, setError] = useState('')

  const commit = () => {
    try {
      const value: unknown = JSON.parse(draft)
      const next = parseExpectation({
        kind: 'equals',
        path: expectation.path,
        value,
      })

      if (next.kind !== 'equals')
        throw new TypeError('Expected an equality expectation.')

      onUpdate(next)
      setDraft(stringifyEditorValue(next.value))
      setError('')
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : 'Invalid encoded EJSON value.',
      )
    }
  }

  return (
    <label>
      Expected value (encoded EJSON)
      <textarea
        aria-label={`Expectation ${index + 1} expected value (encoded EJSON)`}
        rows={3}
        spellCheck={false}
        value={draft}
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

interface ExpectationRowProps {
  expectation: Expectation
  index: number
  onRemove(): void
  onUpdate(expectation: Expectation): void
}

const ExpectationRow = ({
  expectation,
  index,
  onRemove,
  onUpdate,
}: ExpectationRowProps) => {
  const [error, setError] = useState('')
  const update = (value: unknown) => {
    try {
      onUpdate(parseExpectation(value))
      setError('')
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : 'Invalid expectation.',
      )
    }
  }
  const updateBounds = (
    key: 'min' | 'max',
    text: string,
    integerOnly = false,
  ) => {
    const value = text === '' ? undefined : Number(text)

    if (
      value !== undefined &&
      (!Number.isFinite(value) || (integerOnly && !Number.isSafeInteger(value)))
    ) {
      setError(
        integerOnly ? 'Expected a safe integer.' : 'Expected a finite number.',
      )
      return
    }

    const next = { ...expectation, [key]: value }

    if (value === undefined) delete next[key]
    update(next)
  }

  return (
    <fieldset>
      <legend>Expectation {index + 1}</legend>
      <div className={styles.grid}>
        <label>
          Kind
          <select
            aria-label={`Expectation ${index + 1} kind`}
            value={expectation.kind}
            onChange={event =>
              onUpdate(createExpectation(event.target.value as ExpectationKind))
            }
          >
            {EXPECTATION_KINDS.map(kind => (
              <option key={kind} value={kind}>
                {EXPECTATION_LABELS[kind]}
              </option>
            ))}
          </select>
        </label>
        {expectation.kind === 'outcome' && (
          <label>
            Expected outcome
            <select
              aria-label={`Expectation ${index + 1} expected outcome`}
              value={expectation.outcome}
              onChange={event =>
                update({
                  kind: 'outcome',
                  outcome: event.target.value,
                })
              }
            >
              <option value='success'>Success</option>
              <option value='error'>Error</option>
            </select>
          </label>
        )}
        {expectation.kind === 'error-code' && (
          <>
            <label>
              Code type
              <select
                aria-label={`Expectation ${index + 1} error code type`}
                value={typeof expectation.code}
                onChange={event =>
                  update({
                    kind: 'error-code',
                    code: event.target.value === 'number' ? 0 : '',
                  })
                }
              >
                <option value='string'>Text</option>
                <option value='number'>Number</option>
              </select>
            </label>
            <label>
              Error code
              <input
                aria-label={`Expectation ${index + 1} error code`}
                type={typeof expectation.code === 'number' ? 'number' : 'text'}
                value={expectation.code}
                onChange={event =>
                  update({
                    kind: 'error-code',
                    code:
                      typeof expectation.code === 'number'
                        ? Number(event.target.value)
                        : event.target.value,
                  })
                }
              />
            </label>
          </>
        )}
        {'path' in expectation && (
          <label>
            Evidence JSON Pointer
            <input
              aria-label={`Expectation ${index + 1} evidence JSON Pointer`}
              value={expectation.path}
              onChange={event =>
                update({ ...expectation, path: event.target.value })
              }
              placeholder='/result/id'
            />
          </label>
        )}
        {expectation.kind === 'equals' && (
          <ExpectationValueEditor
            key={`${index}:${stringifyEditorValue(expectation.value)}`}
            index={index}
            expectation={expectation}
            onUpdate={onUpdate}
          />
        )}
        {expectation.kind === 'number-bounds' && (
          <>
            <label>
              Minimum (inclusive)
              <input
                aria-label={`Expectation ${index + 1} minimum`}
                type='number'
                value={expectation.min ?? ''}
                onChange={event => updateBounds('min', event.target.value)}
              />
            </label>
            <label>
              Maximum (inclusive)
              <input
                aria-label={`Expectation ${index + 1} maximum`}
                type='number'
                value={expectation.max ?? ''}
                onChange={event => updateBounds('max', event.target.value)}
              />
            </label>
          </>
        )}
        {expectation.kind === 'document-count' && (
          <>
            <label>
              Collection
              <input
                aria-label={`Expectation ${index + 1} collection`}
                value={expectation.collection}
                onChange={event =>
                  update({ ...expectation, collection: event.target.value })
                }
              />
            </label>
            <label>
              Capture boundary
              <select
                aria-label={`Expectation ${index + 1} capture boundary`}
                value={expectation.boundary}
                onChange={event =>
                  update({ ...expectation, boundary: event.target.value })
                }
              >
                <option value='readiness'>Readiness</option>
                <option value='manual'>Manual capture</option>
              </select>
            </label>
            <label>
              Minimum documents
              <input
                aria-label={`Expectation ${index + 1} minimum documents`}
                type='number'
                step={1}
                value={expectation.min ?? ''}
                onChange={event =>
                  updateBounds('min', event.target.value, true)
                }
              />
            </label>
            <label>
              Maximum documents
              <input
                aria-label={`Expectation ${index + 1} maximum documents`}
                type='number'
                step={1}
                value={expectation.max ?? ''}
                onChange={event =>
                  updateBounds('max', event.target.value, true)
                }
              />
            </label>
          </>
        )}
      </div>
      {error && (
        <p className={styles.error} role='alert'>
          {error}
        </p>
      )}
      <button type='button' onClick={onRemove}>
        Remove expectation {index + 1}
      </button>
    </fieldset>
  )
}

export const ExpectationEditor = observer(
  ({ store }: { store: PlaygroundStore }) => {
    const [raw, setRaw] = useState(false)
    let expectations: Expectation[] = []
    let parseError = ''

    try {
      expectations = parseExpectations(store.expectationsText)
    } catch (error) {
      parseError =
        error instanceof Error ? error.message : 'Invalid expectations JSON.'
    }

    const write = (next: Expectation[]) =>
      store.setField('expectationsText', stringifyEditorValue(next))
    const guidedEditor = parseError ? (
      <p className={styles.error} role='alert'>
        {parseError} Open raw JSON to correct it.
      </p>
    ) : (
      <>
        {expectations.map((expectation, index) => (
          <ExpectationRow
            key={index}
            expectation={expectation}
            index={index}
            onRemove={() =>
              write(expectations.filter((_, itemIndex) => itemIndex !== index))
            }
            onUpdate={next =>
              write(
                expectations.map((item, itemIndex) =>
                  itemIndex === index ? next : item,
                ),
              )
            }
          />
        ))}
        {expectations.length === 0 && (
          <p>No expectations yet. Runs can still be inspected normally.</p>
        )}
        <button
          type='button'
          onClick={() => write([...expectations, createExpectation('outcome')])}
        >
          Add expectation
        </button>
      </>
    )

    return (
      <div aria-labelledby='playground-expectations'>
        <div className={styles.editorHeader}>
          <h3 id='playground-expectations'>Expectations</h3>
          <button type='button' onClick={() => setRaw(value => !value)}>
            {raw ? 'Use guided editor' : 'Edit raw JSON'}
          </button>
        </div>
        <p className={styles.muted}>
          Check the response outcome or specific evidence after each run.
          Missing or redacted evidence produces an inconclusive result.
        </p>
        {raw ? (
          <label>
            Declarative expectations (JSON array)
            <textarea
              rows={7}
              spellCheck={false}
              value={store.expectationsText}
              onChange={event =>
                store.setField('expectationsText', event.target.value)
              }
            />
          </label>
        ) : (
          guidedEditor
        )}
        {parseError && raw && (
          <p className={styles.error} role='alert'>
            {parseError}
          </p>
        )}
      </div>
    )
  },
)
