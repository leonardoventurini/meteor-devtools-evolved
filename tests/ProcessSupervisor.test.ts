import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import {
  formatOccupiedPortError,
  terminateOwnedProcessGroup,
} from '../scripts/process-supervisor.mjs'

describe('development process lifecycle', () => {
  it('routes every Meteor launcher through the shared supervisor', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>
    }

    expect(packageJson.scripts.devapp).toContain('run-development.mjs app')
    expect(packageJson.scripts['devapp:2']).toContain(
      'run-development.mjs app:2',
    )
    expect(packageJson.scripts['dev:chrome']).toContain(
      'run-development.mjs chrome',
    )
    expect(packageJson.scripts['dev:firefox']).toContain(
      'run-development.mjs firefox',
    )
    expect(readFileSync('scripts/run-e2e.mjs', 'utf8')).toContain(
      'runManagedCommand',
    )

    const playwrightConfig = readFileSync('playwright.config.ts', 'utf8')
    expect(playwrightConfig).toContain("signal: 'SIGTERM'")
    expect(playwrightConfig).toContain('METEOR_SHUTDOWN_TIMEOUT_MS')
  })

  it('reports occupied ports without treating their owner as managed', () => {
    expect(
      formatOccupiedPortError(2100, {
        command: 'meteor run --port 2100',
        pid: 1234,
      }),
    ).toContain('Port 2100 is already in use by PID 1234')
    expect(formatOccupiedPortError(2100)).toContain('lsof -nP -iTCP:2100')
  })

  it('escalates cleanup only for the recorded process group', async () => {
    const signalGroup = vi
      .fn<(pid: number, signal: NodeJS.Signals | 0) => boolean>()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)

    await terminateOwnedProcessGroup(4321, {
      gracePeriodMs: 0,
      signalGroup,
    })

    expect(signalGroup.mock.calls).toEqual([
      [4321, 'SIGTERM'],
      [4321, 0],
      [4321, 'SIGKILL'],
    ])
  })

  it('does not escalate after graceful termination', async () => {
    const signalGroup = vi
      .fn<(pid: number, signal: NodeJS.Signals | 0) => boolean>()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)

    await terminateOwnedProcessGroup(4321, {
      gracePeriodMs: 0,
      signalGroup,
    })

    expect(signalGroup).not.toHaveBeenCalledWith(4321, 'SIGKILL')
  })
})
