import { useEffect, useState } from 'react'
import { fixtureApi } from '../../client/fixture-client'

const CONTROLS = [
  ['structured-echo', 'Structured echo', 'structuredEcho'],
  ['complex-values', 'Complex values', 'complexValues'],
  ['delayed-success', 'Delayed success', 'delayedSuccess'],
  ['method-failure', 'Method failure', 'methodFailure'],
  ['mutation-lifecycle', 'Mutation lifecycle', 'mutationLifecycle'],
  ['publication-lifecycle', 'Publication lifecycle', 'publicationLifecycle'],
  ['traffic-burst', 'Traffic burst', 'burst'],
  ['local-performance', 'Local performance', 'localPerformance'],
  ['reset', 'Reset fixture', 'reset'],
]

export function FixtureControls() {
  const [status, setStatus] = useState(fixtureApi.getStatus())

  useEffect(() => fixtureApi.subscribe(setStatus), [])

  const invoke = (method) => {
    fixtureApi[method]().catch(() => {
      // Controlled failures are reflected in the fixture status surface.
    })
  }

  return (
    <section className='card fixture-controls' data-testid='fixture-controls'>
      <h2 className='section-title'>Fixture controls</h2>
      <p className='fixture-summary'>Deterministic Meteor 3 DDP and MiniMongo validation scenarios.</p>
      <div className='fixture-actions'>
        {CONTROLS.map(([testId, label, method]) => (
          <button className='button' data-testid={`fixture-${testId}`} disabled={status.activeScenario !== null} key={testId} onClick={() => invoke(method)} type='button'>
            {label}
          </button>
        ))}
      </div>
      <dl className='fixture-status' data-testid='fixture-status'>
        <div><dt>Ready</dt><dd data-testid='fixture-ready'>{String(status.ready)}</dd></div>
        <div><dt>Primary records</dt><dd data-testid='fixture-primary-count'>{status.baseline.projects + status.baseline.tasks + status.baseline.events}</dd></div>
        <div><dt>Secondary records</dt><dd data-testid='fixture-secondary-count'>{status.secondary.count}</dd></div>
        <div><dt>Last scenario</dt><dd data-testid='fixture-last-scenario'>{status.lastScenario ?? 'none'}</dd></div>
      </dl>
    </section>
  )
}
