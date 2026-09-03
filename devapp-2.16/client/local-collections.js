import { Mongo } from 'meteor/mongo'
import { FIXTURE_COLLECTION_NAMES } from '../imports/api/fixture-data'

const firstLocalCollection = new Mongo.Collection(null)
const secondLocalCollection = new Mongo.Collection(null)

firstLocalCollection.insert({ _id: 'local-one', fixture: 'Meteor 2.16' })
secondLocalCollection.insert({ _id: 'local-two', fixture: 'Meteor 2.16' })

// Preserve the stable DevTools identities of the two legacy unnamed
// collections by registering the named performance fixture after them.
export const FixtureClientOps = new Mongo.Collection(
  FIXTURE_COLLECTION_NAMES.clientOps,
  { connection: null },
)

export const runLocalPerformanceScenario = () => {
  const id = 'fixture-client-operation'

  FixtureClientOps.remove({})
  FixtureClientOps.insert({ _id: id, stage: 'inserted', value: 1 })
  FixtureClientOps.update(id, { $set: { stage: 'updated', value: 2 } })
  const updated = FixtureClientOps.findOne(id)
  FixtureClientOps.remove(id)

  return { id, updated, remaining: FixtureClientOps.find().count() }
}
