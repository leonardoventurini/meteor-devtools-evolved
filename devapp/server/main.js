import { Meteor } from 'meteor/meteor';
import { LinksCollection } from '../imports/api/links';
import { RandomCollection } from '../imports/api/random';

function insertLink(title, url) {
  LinksCollection.insert({ title, url, createdAt: new Date() });
}

Meteor.methods({
  echo(echo) {
    return echo;
  },
});

Meteor.startup(() => {
  if (LinksCollection.find().count() === 0) {
    insertLink(
      'Do the Tutorial',
      'https://www.meteor.com/tutorials/react/creating-an-app',
    );

    insertLink('Follow the Guide', 'http://guide.meteor.com');

    insertLink('Read the Docs', 'https://docs.meteor.com');

    insertLink('Discussions', 'https://forums.meteor.com');
  }

  if (RandomCollection.find().count() === 0) {
    let counter = 1;

    new Array(1000)
      .fill(null)
      .map(() => ({
        name: 'Lorem Ipsum '.concat(String(counter)),
        number: counter++,
      }))
      .forEach(item => {
        RandomCollection.insert(item);
      });
  }
});
