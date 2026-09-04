import { execFile } from 'node:child_process'
import net from 'node:net'
import { promisify } from 'node:util'
import spawn from 'cross-spawn'

const execFileAsync = promisify(execFile)
const DEFAULT_GRACE_PERIOD_MS = 4000
const POLL_INTERVAL_MS = 100

const delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds))

const defaultSignalGroup = (pid, signal) => {
  try {
    process.kill(process.platform === 'win32' ? pid : -pid, signal)
    return true
  } catch (error) {
    if (error?.code === 'ESRCH') return false
    throw error
  }
}

export const terminateOwnedProcessGroup = async (
  pid,
  {
    gracePeriodMs = DEFAULT_GRACE_PERIOD_MS,
    signalGroup = defaultSignalGroup,
  } = {},
) => {
  if (!signalGroup(pid, 'SIGTERM')) return

  const deadline = Date.now() + gracePeriodMs
  while (Date.now() < deadline) {
    await delay(Math.min(POLL_INTERVAL_MS, deadline - Date.now()))
    if (!signalGroup(pid, 0)) return
  }

  if (signalGroup(pid, 0)) signalGroup(pid, 'SIGKILL')
}

const canConnect = port =>
  new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
  })

const findPortOwner = async port => {
  if (process.platform === 'win32') return null

  try {
    const { stdout } = await execFileAsync('lsof', [
      '-nP',
      `-iTCP:${port}`,
      '-sTCP:LISTEN',
      '-Fpc',
    ])
    const pid = Number(stdout.match(/^p(\d+)$/m)?.[1])
    const command = stdout.match(/^c(.+)$/m)?.[1]

    return Number.isInteger(pid) ? { command, pid } : null
  } catch {
    return null
  }
}

export const formatOccupiedPortError = (port, owner) => {
  const inspectionCommand = `lsof -nP -iTCP:${port} -sTCP:LISTEN`
  if (!owner) {
    return `Port ${port} is already in use. Inspect it with: ${inspectionCommand}`
  }

  const command = owner.command ? ` (${owner.command})` : ''
  return [
    `Port ${port} is already in use by PID ${owner.pid}${command}.`,
    `Inspect it with: ${inspectionCommand}`,
    `If it is safe to stop, run: kill -TERM ${owner.pid}`,
  ].join('\n')
}

export const assertPortsAvailable = async ports => {
  for (const port of ports) {
    if (await canConnect(port)) {
      throw new Error(formatOccupiedPortError(port, await findPortOwner(port)))
    }
  }
}

export const waitForUrl = async (url, timeoutMs = 300_000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // The server has not started accepting requests yet.
    }
    await delay(250)
  }

  throw new Error(`Timed out waiting for ${url}.`)
}

export const runManagedCommands = async ({ commands, ports = [] }) => {
  await assertPortsAvailable(ports)
  const children = new Map()
  let cleanupPromise
  let interruptionStatus

  const cleanup = () => {
    cleanupPromise ??= Promise.all(
      [...children.values()].map(({ child }) =>
        terminateOwnedProcessGroup(child.pid),
      ),
    )
    return cleanupPromise
  }

  const signalHandlers = new Map()
  const signalStatuses = new Map([
    ['SIGHUP', 129],
    ['SIGINT', 130],
    ['SIGTERM', 143],
  ])
  for (const [signal, status] of signalStatuses) {
    const handler = () => {
      interruptionStatus = status
      void cleanup()
    }
    signalHandlers.set(signal, handler)
    process.once(signal, handler)
  }

  try {
    for (const command of commands) {
      if (command.waitForUrl) {
        const earlyExitStatus = await Promise.race([
          waitForUrl(command.waitForUrl),
          ...[...children.values()].map(({ completion }) => completion),
        ])
        if (earlyExitStatus !== undefined) return earlyExitStatus
      }

      const child = spawn(command.file, command.arguments ?? [], {
        cwd: command.cwd,
        detached: process.platform !== 'win32',
        env: { ...process.env, ...command.env },
        stdio: 'inherit',
      })
      const completion = new Promise((resolve, reject) => {
        child.once('error', reject)
        child.once('exit', (code, signal) => {
          resolve(code ?? (signal ? 1 : 0))
        })
      })
      children.set(child.pid, { child, completion })
    }

    const status = await Promise.race(
      [...children.values()].map(({ completion }) => completion),
    )
    return interruptionStatus ?? status
  } finally {
    for (const [signal, handler] of signalHandlers) {
      process.removeListener(signal, handler)
    }
    await cleanup()
  }
}

export const runManagedCommand = async command =>
  runManagedCommands({ commands: [command] })
