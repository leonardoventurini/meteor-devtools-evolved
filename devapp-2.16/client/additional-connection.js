import { DDP } from 'meteor/ddp-client'
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { FIXTURE_COLLECTION_NAMES } from '../imports/api/fixture-data'

export const additionalConnection = DDP.connect(Meteor.absoluteUrl())
export const FixtureRemote = new Mongo.Collection(
  FIXTURE_COLLECTION_NAMES.remote,
  { connection: additionalConnection },
)

export const remoteReady = new Promise((resolve, reject) => {
  additionalConnection.subscribe('fixture.remote', {
    onReady() {
      resolve({ ready: true })
    },
    onError(error) {
      reject(error)
    },
  })
})
