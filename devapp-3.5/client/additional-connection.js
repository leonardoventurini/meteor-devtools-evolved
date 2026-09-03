import { DDP } from 'meteor/ddp-client'
import { Mongo } from 'meteor/mongo'
import { Meteor } from 'meteor/meteor'
import { FIXTURE_COLLECTION_NAMES } from '/imports/api/fixture-data'

export const additionalConnection = DDP.connect(Meteor.absoluteUrl())

export const RemoteCollection = new Mongo.Collection(FIXTURE_COLLECTION_NAMES.remote, {
  connection: additionalConnection,
})

export const remoteSubscription = additionalConnection.subscribe('fixture.remote')
