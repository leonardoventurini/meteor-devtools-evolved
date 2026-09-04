import { runManagedCommand } from './process-supervisor.mjs'

const METEOR_FIXTURE_ENVIRONMENT_KEY = 'E2E_METEOR_FIXTURE'
const YARN_COMMAND = process.platform === 'win32' ? 'yarn.cmd' : 'yarn'
const fixtureIds = process.argv.slice(2)

if (fixtureIds.length === 0) {
  throw new TypeError('Pass at least one Meteor fixture ID to the E2E runner.')
}

for (const fixtureId of fixtureIds) {
  const status = await runManagedCommand({
    file: YARN_COMMAND,
    arguments: ['playwright', 'test'],
    env: {
      [METEOR_FIXTURE_ENVIRONMENT_KEY]: fixtureId,
    },
  })
  if (status !== 0) {
    process.exitCode = status
    break
  }
}
