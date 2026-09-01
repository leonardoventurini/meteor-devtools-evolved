import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

Meteor.startup(() => {
  const firstLocalCollection = new Mongo.Collection(null)
  const secondLocalCollection = new Mongo.Collection(null)

  firstLocalCollection.insert({ _id: 'local-one', fixture: 'Meteor 2.16' })
  secondLocalCollection.insert({ _id: 'local-two', fixture: 'Meteor 2.16' })
})
