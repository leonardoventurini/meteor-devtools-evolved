import assert from 'assert'
import {
  FIXTURE_COLLECTION_NAMES,
  FIXTURE_CONTRACT_VERSION,
  FIXTURE_COUNTS,
  FIXTURE_METHODS,
  FIXTURE_PUBLICATIONS,
  makeEvents,
  makeProjects,
  makeRemoteRecords,
  makeSafeComplexValues,
  makeTasks,
} from '../imports/api/fixture-data'

describe('devapp-2.16', function () {
  it('package.json has correct name', async function () {
    const { name } = await import('../package.json')
    assert.strictEqual(name, 'devapp-2.16')
  })

  it('runs on the maintained Meteor 2 release', function () {
    assert.strictEqual(Meteor.release, 'METEOR@2.16')
  })

  it('generates the exact deterministic fixture cardinalities and unique ids', function () {
    const generated = {
      projects: makeProjects(),
      tasks: makeTasks(),
      events: makeEvents(),
      remote: makeRemoteRecords(),
    }

    Object.entries(generated).forEach(([name, records]) => {
      assert.strictEqual(records.length, FIXTURE_COUNTS[name])
      assert.strictEqual(new Set(records.map(record => record._id)).size, records.length)
    })

    assert.strictEqual(generated.projects[0]._id, 'project-01')
    assert.strictEqual(generated.tasks[219]._id, 'task-220')
    assert.strictEqual(generated.events[509]._id, 'event-510')
    assert.strictEqual(generated.remote[11]._id, 'remote-12')
  })

  it('includes representative safe complex values', function () {
    const projects = makeProjects()
    const tasks = makeTasks()
    const values = makeSafeComplexValues()

    assert.match(projects[0].name, /Árvore/)
    assert.strictEqual(projects[3].nullable, null)
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(projects[4], 'optionalNote'),
      false,
    )
    assert.match(tasks[7].description, /\n/)
    assert.ok(tasks[8].description.length > 500)
    assert.ok(values.date instanceof Date)
    assert.strictEqual(values.boundary, Number.MAX_SAFE_INTEGER)
    assert.deepStrictEqual(values.array[4], { nested: 'value' })
  })

  it('exports the stable Meteor fixture catalog', function () {
    assert.strictEqual(FIXTURE_CONTRACT_VERSION, 1)
    assert.deepStrictEqual(Object.values(FIXTURE_COLLECTION_NAMES), [
      'fixtureProjects',
      'fixtureTasks',
      'fixtureEvents',
      'fixtureRemote',
      'fixtureClientOps',
    ])
    assert.strictEqual(FIXTURE_PUBLICATIONS.length, 8)
    assert.strictEqual(FIXTURE_METHODS.length, 9)
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
