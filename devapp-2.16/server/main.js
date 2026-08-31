import { Meteor } from 'meteor/meteor'
import { LinksCollection } from '../imports/api/links'
import { RandomCollection } from '../imports/api/random'

function insertLink(title, url) {
  LinksCollection.insert({ title, url, createdAt: new Date() })
}

Meteor.methods({
  echo(echo) {
    return echo
  },
})

Meteor.startup(() => {
  if (LinksCollection.find().count() === 0) {
    insertLink(
      'Do the Tutorial',
      'https://www.meteor.com/tutorials/react/creating-an-app',
    )

    insertLink('Follow the Guide', 'http://guide.meteor.com')

    insertLink('Read the Docs', 'https://docs.meteor.com')

    insertLink('Discussions', 'https://forums.meteor.com')
  }

  RandomCollection.remove({})

  let counter = 1

  new Array(1000)
    .fill(null)
    .map(() => ({
      name: 'Lorem Ipsum '.concat(String(counter)),
      number: counter++,
    }))
    .forEach(item => {
      RandomCollection.insert(item)
    })
})

Meteor.publish('random1to100', function () {
  return RandomCollection.find({
    number: { $gte: 1, $lte: 100 },
  })
})

Meteor.publish('random101to200', function () {
  return RandomCollection.find({
    number: { $gte: 101, $lte: 200 },
  })
})

Meteor.publish('random201to300', function () {
  return RandomCollection.find({
    number: { $gte: 201, $lte: 300 },
  })
})

Meteor.publish('random301to400', function () {
  return RandomCollection.find({
    number: { $gte: 301, $lte: 400 },
  })
})

Meteor.publish('random401to500', function () {
  return RandomCollection.find({
    number: { $gte: 401, $lte: 500 },
  })
})

Meteor.publish('random501to600', function () {
  return RandomCollection.find({
    number: { $gte: 501, $lte: 600 },
  })
})

Meteor.publish('random601to700', function () {
  return RandomCollection.find({
    number: { $gte: 601, $lte: 700 },
  })
})

Meteor.publish('random701to800', function () {
  return RandomCollection.find({
    number: { $gte: 701, $lte: 800 },
  })
})

Meteor.publish('random801to900', function () {
  return RandomCollection.find({
    number: { $gte: 801, $lte: 900 },
  })
})

Meteor.publish('random901to1000', function () {
  return RandomCollection.find({
    number: { $gte: 901, $lte: 1000 },
  })
})
