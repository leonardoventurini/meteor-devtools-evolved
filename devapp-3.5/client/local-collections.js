import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

Meteor.startup(async () => {
  const firstLocalCollection = new Mongo.Collection(null)
  const secondLocalCollection = new Mongo.Collection(null)

  await Promise.all([
    firstLocalCollection.insertAsync({
      _id: 'local-one',
      fixture: 'Meteor 3.5.1',
    }),
    secondLocalCollection.insertAsync({
      _id: 'local-two',
      fixture: 'Meteor 3.5.1',
    }),
  ])
})
