import assert from 'assert'
import { FIXTURE_COUNTS, FIXTURE_METHODS, FIXTURE_PUBLICATIONS, generateEvents, generateProjects, generateRemoteRecords, generateTasks } from '../imports/api/fixture-data'

describe('devapp-3.5', function () {
  it('package.json has correct name', async function () {
    const { name } = await import('../package.json')
    assert.strictEqual(name, 'devapp-3.5')
  })

  it('runs on the maintained Meteor 3 release', function () {
    assert.strictEqual(Meteor.release, 'METEOR@3.5.1')
  })

  it('generates the exact deterministic fixture cardinality', function () {
    assert.strictEqual(generateProjects().length, FIXTURE_COUNTS.projects)
    assert.strictEqual(generateTasks().length, FIXTURE_COUNTS.tasks)
    assert.strictEqual(generateEvents().length, FIXTURE_COUNTS.events)
    assert.strictEqual(generateRemoteRecords().length, FIXTURE_COUNTS.remote)
  })

  it('generates unique stable IDs and representative rich values', function () {
    const records = [...generateProjects(), ...generateTasks(), ...generateEvents()]
    assert.strictEqual(new Set(records.map(({ _id }) => _id)).size, records.length)
    assert.strictEqual(generateProjects()[0]._id, 'project-00')
    assert.strictEqual(generateProjects()[0].nullable, null)
    assert.match(generateProjects()[0].name, /🚀/u)
    assert.ok(generateProjects()[0].createdAt instanceof Date)
    assert.match(generateTasks()[0].title, /\n/u)
    assert.ok(generateTasks()[3].description.length > 400)
    assert.strictEqual(Object.hasOwn(generateTasks()[0], 'description'), false)
  })

  it('exports the complete publication and method catalogs', function () {
    assert.deepStrictEqual(FIXTURE_PUBLICATIONS, ['fixture.projects', 'fixture.tasks', 'fixture.dashboard', 'fixture.tasks.overlap', 'fixture.empty', 'fixture.delayed', 'fixture.rejected', 'fixture.remote'])
    assert.deepStrictEqual(FIXTURE_METHODS, ['fixture.echo', 'fixture.values', 'fixture.delayed', 'fixture.fail', 'fixture.mutation.insert', 'fixture.mutation.update', 'fixture.mutation.remove', 'fixture.mutation.reset', 'fixture.burst'])
  })

  if (Meteor.isClient) {
    it('client is not server', function () {
      assert.strictEqual(Meteor.isServer, false)
    })
  }

  if (Meteor.isServer) {
    it('server is not client', function () {
      assert.strictEqual(Meteor.isClient, false)
    })
  }
})
