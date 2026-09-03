import React, { useEffect, useState } from 'react'
import { STATUS_EVENT, fixtureContract } from '../../client/fixture-contract'

const CONTROLS = [
  ['structuredEcho', 'Structured echo', 'fixture-structured-echo'],
  ['complexValues', 'Complex values', 'fixture-complex-values'],
  ['delayedSuccess', 'Delayed success', 'fixture-delayed-success'],
  ['methodFailure', 'Method failure', 'fixture-method-failure'],
  ['mutationLifecycle', 'Mutation lifecycle', 'fixture-mutation-lifecycle'],
  [
    'publicationLifecycle',
    'Publication lifecycle',
    'fixture-publication-lifecycle',
  ],
  ['burst', 'Traffic burst', 'fixture-burst'],
  ['localPerformance', 'Local performance', 'fixture-local-performance'],
  ['reset', 'Reset scenarios', 'fixture-reset'],
]

export const App = () => {
  const [status, setStatus] = useState(fixtureContract.getStatus())

  useEffect(() => {
    const update = event => setStatus(event.detail)
    window.addEventListener(STATUS_EVENT, update)
    fixtureContract.waitUntilReady().then(setStatus).catch(() => {
      setStatus(fixtureContract.getStatus())
    })

    return () => window.removeEventListener(STATUS_EVENT, update)
  }, [])

  const run = name => {
    fixtureContract[name]().catch(() => {
      setStatus(fixtureContract.getStatus())
    })
  }

  return (
    <main className="fixture-page">
      <header>
        <p className="eyebrow">Meteor 2.16 validation fixture</p>
        <h1>Meteor DevTools scenario catalog</h1>
        <p>
          Deterministic data and bounded controls for inspecting DDP,
          subscriptions, MiniMongo, methods, and local performance.
        </p>
      </header>

      <section className="fixture-card" data-testid="fixture-controls">
        <h2>Fixture controls</h2>
        <div className="fixture-controls">
          {CONTROLS.map(([name, label, testId]) => (
            <button
              key={name}
              type="button"
              data-testid={testId}
              disabled={Boolean(status.activeScenario) || !status.ready}
              onClick={() => run(name)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="fixture-card" aria-live="polite">
        <h2>Status</h2>
        <pre data-testid="fixture-status">{JSON.stringify(status, null, 2)}</pre>
      </section>
    </main>
  )
}
