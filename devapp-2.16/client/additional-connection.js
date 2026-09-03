import { DDP } from 'meteor/ddp-client'
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { FIXTURE_COLLECTION_NAMES } from '../imports/api/fixture-data'

export let additionalConnection
export let FixtureRemote

export const remoteReady = new Promise((resolve, reject) => {
  Meteor.startup(() => {
    // Let document-start extension instrumentation install before opening the
    // additional socket, so this connection is observable independently.
    Meteor.defer(() => {
      additionalConnection = DDP.connect(Meteor.absoluteUrl())
      FixtureRemote = new Mongo.Collection(FIXTURE_COLLECTION_NAMES.remote, {
        connection: additionalConnection,
      })

      additionalConnection.subscribe('fixture.remote', {
        onReady() {
          resolve({ ready: true })
        },
        onError(error) {
          reject(error)
        },
      })
    })
  })
})
