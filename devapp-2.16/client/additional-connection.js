import { DDP } from 'meteor/ddp-client'
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

Meteor.startup(() => {
  const additionalConnection = DDP.connect(Meteor.absoluteUrl())

  new Mongo.Collection('additionalLinks', {
    connection: additionalConnection,
  })
})
