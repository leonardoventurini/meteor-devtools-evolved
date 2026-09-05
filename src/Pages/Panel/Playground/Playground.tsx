import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { toJS } from 'mobx'
import styled from 'styled-components'
import { usePanelStore } from '@/Stores/PanelStore'
import { Hideable } from '@/Utils/Hideable'
import { evaluateExpectation } from '@/Playground/Evidence'
import { PLAYGROUND_LIMITS } from '@/Playground/Limits'
import type { PlaygroundStore } from '@/Stores/Panel/PlaygroundStore'

const Wrapper = styled.div`
  overflow: auto !important;
  padding: 16px !important;
  font-size: 12px;
  h1 {
    font-size: 20px;
    margin: 0 0 8px;
  }
  h2 {
    font-size: 15px;
    margin: 0 0 12px;
  }
  h3 {
    font-size: 13px;
  }
  section {
    border: 1px solid rgba(128, 128, 128, 0.35);
    padding: 14px;
    border-radius: 5px;
    margin-bottom: 14px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }
  input,
  select,
  textarea {
    border: 1px solid rgba(128, 128, 128, 0.5);
    border-radius: 3px;
    color: inherit;
    background: transparent;
    padding: 7px;
    width: 100%;
    box-sizing: border-box;
  }
  option {
    color: #202b33;
    background: white;
  }
  textarea {
    font-family: monospace;
    resize: vertical;
  }
  button {
    border: 1px solid rgba(128, 128, 128, 0.5);
    border-radius: 3px;
    padding: 6px 10px;
    color: inherit;
    background: rgba(128, 128, 128, 0.12);
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid #48aff0;
    outline-offset: 2px;
  }
  button.primary {
    background: #137cbd;
    color: white;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr));
    gap: 12px;
    margin-bottom: 12px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 10px 0;
  }
  .check {
    flex-direction: row;
    align-items: center;
  }
  .check input {
    width: auto;
  }
  .muted {
    opacity: 0.8;
  }
  .notice {
    border-left: 3px solid #137cbd;
    padding: 8px;
  }
  .error {
    border-left: 3px solid #db3737;
    padding: 8px;
  }
  pre {
    max-height: 280px;
    overflow: auto;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-size: 11px;
    margin: 8px 0;
  }
  ul {
    padding-left: 20px;
  }
  li {
    margin-bottom: 8px;
    overflow-wrap: anywhere;
  }
  details {
    margin: 12px 0;
  }
  summary {
    cursor: pointer;
    padding: 6px 0;
  }
`
const JSON_PAGE_CHARS = 16_384
export function EvidenceJSON({
  value,
  label = 'Evidence',
}: {
  value: unknown
  label?: string
}) {
  const [page, setPage] = useState(0)
  const text = JSON.stringify(value, null, 2) ?? ''
  const lastPage = Math.max(0, Math.ceil(text.length / JSON_PAGE_CHARS) - 1)
  const current = Math.min(page, lastPage)
  return (
    <div>
      <pre aria-label={label}>
        {text.slice(current * JSON_PAGE_CHARS, (current + 1) * JSON_PAGE_CHARS)}
      </pre>
      {lastPage > 0 && (
        <div className='actions'>
          <button
            onClick={() => setPage(Math.max(0, current - 1))}
            disabled={current === 0}
          >
            Previous evidence page
          </button>
          <span>
            {current + 1} / {lastPage + 1} · {text.length.toLocaleString()}{' '}
            characters
          </span>
          <button
            onClick={() => setPage(Math.min(lastPage, current + 1))}
            disabled={current === lastPage}
          >
            Next evidence page
          </button>
        </div>
      )}
    </div>
  )
}
const RunResults = observer(({ store }: { store: PlaygroundStore }) => {
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
      <p className='muted'>
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
            <p className='notice'>
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
          <div className='actions'>
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
          <p className='muted'>
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
const Catalog = observer(({ store }: { store: PlaygroundStore }) => (
  <section>
    <h2>Observed endpoints</h2>
    <p className='muted'>
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
          <div className='actions'>
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
const Matrix = observer(({ store }: { store: PlaygroundStore }) => (
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
    <div className='grid'>
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
      <label className='check'>
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
    <p className='muted'>
      Concurrency 1. Total elapsed budget 120 seconds. Timeout, interruption,
      context change, truncation, or resource limits always stop the remaining
      queue. Subscription variants capture readiness and release their handles
      before the next starts.
    </p>
    <div className='actions'>
      <button
        disabled={store.matrixRunning}
        onClick={() => void store.attempt(store.previewMatrix)}
      >
        Preview variants
      </button>
      <button
        className='primary'
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
const toggle = (items: string[], id: string) =>
  items.includes(id) ? items.filter(item => item !== id) : [...items, id]
const Saved = observer(({ store }: { store: PlaygroundStore }) => {
  const [selectedCases, setSelectedCases] = useState<string[]>([])
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([])
  return (
    <section>
      <h2>Saved cases and snapshots</h2>
      <div className='actions'>
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
      <p className='muted'>
        Cases remain editable. Saved snapshots never change. Imports create new
        local IDs; importing does not execute any request or select an
        authentication session.
      </p>
      {store.storageErrors.map(error => (
        <p className='error' key={error}>
          {error}
        </p>
      ))}
      <h3>Cases</h3>
      <ul>
        {store.cases.map(record => (
          <li key={record.id}>
            <label className='check'>
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
            <div className='actions'>
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
            <label className='check'>
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
            <div className='actions'>
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
})
const Comparison = observer(({ store }: { store: PlaygroundStore }) => {
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
      <div className='grid'>
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
const Transfer = observer(({ store }: { store: PlaygroundStore }) => {
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
      <p className='muted'>
        Example: {`{"record-id": ["/operation/parameters/0/secret"]}`}. Snapshot
        argument paths start with /request/operation/parameters; evidence paths
        start with /evidence/data. Masked values remain marked as redacted.
      </p>
      <button onClick={() => void store.attempt(store.applyMasks)}>
        Apply masks and refresh preview
      </button>
      <EvidenceJSON
        value={store.transferPreview}
        label='Reviewed transfer preview'
      />
      <div className='actions'>
        <button
          className='primary'
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
})
export const Playground = observer(({ isVisible }: { isVisible: boolean }) => {
  const panel = usePanelStore()
  const store = panel.playgroundStore
  useEffect(() => {
    if (isVisible) void store.attempt(store.loadSaved)
  }, [isVisible, store])
  return (
    <Hideable isVisible={isVisible}>
      <Wrapper className='mde-content'>
        <h1>DDP Playground</h1>
        <p>
          Edit captured calls or compose methods and publications for this
          inspected page. Every Run is a fresh invocation and may execute client
          stubs or change server data.
        </p>
        {store.error && (
          <p className='error' role='alert'>
            {store.error}
          </p>
        )}
        {store.notice && (
          <p className='notice' role='status'>
            {store.notice}
          </p>
        )}
        <section>
          <h2>Request editor</h2>
          <button onClick={store.newDraft}>New request / case</button>
          <p role='status'>
            {store.sessionReady
              ? 'Inspected page session ready'
              : 'Waiting for inspected page session'}
            {!store.targetConfirmed &&
              ' · Select an explicit target for this draft'}
          </p>
          <div className='grid'>
            <label>
              Target connection
              <select
                value={store.targetConfirmed ? store.connectionId : ''}
                onChange={event => {
                  if (event.target.value) {
                    panel.setActiveConnectionId(event.target.value)
                    store.selectConnection(event.target.value)
                  }
                }}
              >
                <option value=''>Select an available target</option>
                {store.connections.map(connection => (
                  <option key={connection.id} value={connection.id}>
                    {connection.displayName} ({connection.id})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Operation
              <select
                value={store.kind}
                onChange={event =>
                  store.setField(
                    'kind',
                    event.target.value as 'method' | 'subscription',
                  )
                }
              >
                <option value='method'>Method</option>
                <option value='subscription'>Publication subscription</option>
              </select>
            </label>
            <label>
              Method or publication name
              <input
                value={store.name}
                onChange={event => store.setField('name', event.target.value)}
                maxLength={256}
              />
            </label>
          </div>
          <label>
            Parameters (encoded EJSON array)
            <textarea
              rows={6}
              spellCheck={false}
              value={store.parametersText}
              onChange={event =>
                store.setField('parametersText', event.target.value)
              }
            />
          </label>
          <p className='muted'>
            Use encoded EJSON, for example {`[{"$date": 0}]`}. Custom EJSON
            types decode only in the inspected application using its registered
            types.
          </p>
          {store.unresolvedRequestMasks.length > 0 && (
            <div className='notice'>
              <strong>Masked request fields require replacement review</strong>
              <p>
                Restore each missing field in the parameters editor. Null
                entries are redaction placeholders unless you explicitly intend
                to submit null. Editing another field or selecting a target does
                not resolve these masks.
              </p>
              <ul>
                {store.unresolvedRequestMasks.map(path => (
                  <li key={path}>{path}</li>
                ))}
              </ul>
              <button
                onClick={() => void store.attempt(store.resolveRequestMasks)}
              >
                Use reviewed replacements (including intentional null values)
              </button>
            </div>
          )}
          <div className='grid'>
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
                <option value='application'>
                  Application connection · current session
                </option>
                <option value='isolated'>Fresh isolated connection</option>
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
                    Reuse current session explicitly (when supported)
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
          </div>
          {store.mode === 'isolated' && (
            <p className='notice'>
              {store.isolatedAuthentication === 'reuse'
                ? 'Reuse requests an in-memory credential transfer only when the selected connection exposes a verified supported session capability. It fails explicitly when unavailable; no credential is saved or exported.'
                : 'Anonymous isolated connections do not inherit the inspected application login.'}{' '}
              Each isolated run opens a fresh connection to the selected
              discovered endpoint.
            </p>
          )}
          <div className='actions'>
            <button
              className='primary'
              disabled={
                !store.sessionReady ||
                !store.targetConfirmed ||
                store.matrixRunning
              }
              onClick={() => void store.attempt(store.run)}
            >
              {store.kind === 'method'
                ? 'Run method'
                : 'Start publication probe'}
            </button>
            <button onClick={store.stopAll}>
              Stop all playground operations
            </button>
          </div>
          <details>
            <summary>
              Case metadata, expectations, and comparison exclusions
            </summary>
            <div className='grid'>
              <label>
                Case title
                <input
                  value={store.title}
                  onChange={event =>
                    store.setField('title', event.target.value)
                  }
                />
              </label>
              <label>
                Tags (comma-separated)
                <input
                  value={store.tagsText}
                  onChange={event =>
                    store.setField('tagsText', event.target.value)
                  }
                />
              </label>
            </div>
            <label>
              Notes
              <textarea
                rows={3}
                value={store.notes}
                onChange={event => store.setField('notes', event.target.value)}
              />
            </label>
            <label>
              Declarative expectations (JSON array)
              <textarea
                rows={5}
                value={store.expectationsText}
                onChange={event =>
                  store.setField('expectationsText', event.target.value)
                }
              />
            </label>
            <p className='muted'>
              Kinds: outcome, error-code, equals, exists, absent, number-bounds,
              document-count. Missing or redacted evidence yields inconclusive
              results. No scripts run.
            </p>
            <EvidenceJSON
              value={[
                { kind: 'outcome', outcome: 'error' },
                { kind: 'error-code', code: 'not-authorized' },
              ]}
            />
            <label>
              Excluded comparison JSON Pointers (JSON array)
              <textarea
                rows={3}
                value={store.excludedPathsText}
                onChange={event =>
                  store.setField('excludedPathsText', event.target.value)
                }
              />
            </label>
          </details>
        </section>
        <RunResults store={store} />
        <Transfer store={store} />
        <Matrix store={store} />
        <Catalog store={store} />
        <Saved store={store} />
        <Comparison store={store} />
      </Wrapper>
    </Hideable>
  )
})
