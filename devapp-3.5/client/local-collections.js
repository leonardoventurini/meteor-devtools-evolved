import { Mongo } from 'meteor/mongo'
import { FIXTURE_COLLECTION_NAMES } from '/imports/api/fixture-data'

export const FirstLocalCollection = new Mongo.Collection(null)
export const SecondLocalCollection = new Mongo.Collection(null)
export const ClientOps = new Mongo.Collection(FIXTURE_COLLECTION_NAMES.clientOps, { connection: null })

export async function initializeLocalCollections() {
  await Promise.all([
    FirstLocalCollection.upsertAsync('local-one', { $set: { fixture: 'Meteor 3.5.1' } }),
    SecondLocalCollection.upsertAsync('local-two', { $set: { fixture: 'Meteor 3.5.1' } }),
  ])
}
