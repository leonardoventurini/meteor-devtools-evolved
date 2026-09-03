import { Mongo } from 'meteor/mongo'
import { FIXTURE_COLLECTION_NAMES } from '/imports/api/fixture-data'

export let FirstLocalCollection
export let SecondLocalCollection
export let ClientOps

export async function initializeLocalCollections() {
  // Preserve the generated fixture's two original unnamed collections as the
  // first local instances observed after Meteor startup.
  FirstLocalCollection = new Mongo.Collection(null)
  await FirstLocalCollection.insertAsync({ _id: 'local-one', fixture: 'Meteor 3.5.1' })

  SecondLocalCollection = new Mongo.Collection(null)
  await SecondLocalCollection.insertAsync({ _id: 'local-two', fixture: 'Meteor 3.5.1' })

  ClientOps = new Mongo.Collection(FIXTURE_COLLECTION_NAMES.clientOps, { connection: null })
}
