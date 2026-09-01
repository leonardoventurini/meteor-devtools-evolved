import { spawnSync } from 'node:child_process'

const METEOR_FIXTURE_ENVIRONMENT_KEY = 'E2E_METEOR_FIXTURE'
const YARN_COMMAND = process.platform === 'win32' ? 'yarn.cmd' : 'yarn'
const fixtureIds = process.argv.slice(2)

if (fixtureIds.length === 0) {
  throw new TypeError('Pass at least one Meteor fixture ID to the E2E runner.')
}

for (const fixtureId of fixtureIds) {
  const result = spawnSync(YARN_COMMAND, ['playwright', 'test'], {
    env: {
      ...process.env,
      [METEOR_FIXTURE_ENVIRONMENT_KEY]: fixtureId,
    },
    stdio: 'inherit',
  })

  if (result.error) throw result.error

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1
    break
  }
}
