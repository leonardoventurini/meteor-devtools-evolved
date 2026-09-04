#!/usr/bin/env node
import { runManagedCommands } from './process-supervisor.mjs'

const mode = process.argv[2]
const configurations = {
  app: {
    commands: [
      { file: 'meteor', arguments: ['npm', 'start'], cwd: 'devapp-3.5' },
    ],
    ports: [2100, 2101],
  },
  'app:2': {
    commands: [
      {
        file: 'meteor',
        arguments: ['run', '--port', '2200'],
        cwd: 'devapp-2.16',
      },
    ],
    ports: [2200, 2201],
  },
  chrome: {
    commands: [
      { file: 'meteor', arguments: ['npm', 'start'], cwd: 'devapp-3.5' },
      {
        file: 'yarn',
        arguments: ['wxt', '-b', 'chrome'],
        waitForUrl: 'http://127.0.0.1:2100',
      },
    ],
    ports: [2100, 2101],
  },
  firefox: {
    commands: [
      { file: 'meteor', arguments: ['npm', 'start'], cwd: 'devapp-3.5' },
      {
        file: 'yarn',
        arguments: ['wxt', '-b', 'firefox', '--mv2'],
        waitForUrl: 'http://127.0.0.1:2100',
      },
    ],
    ports: [2100, 2101],
  },
}

if (!Object.hasOwn(configurations, mode)) {
  throw new TypeError(
    `Unknown development mode "${mode ?? ''}". Expected: ${Object.keys(configurations).join(', ')}.`,
  )
}

process.exitCode = await runManagedCommands(configurations[mode])
