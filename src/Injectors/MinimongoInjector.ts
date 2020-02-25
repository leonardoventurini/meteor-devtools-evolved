import { Registry, sendMessage } from '../Injector';

const cleanup = (object: any) => {
  Object.keys(object).forEach((key: string) => {
    if (object[key] instanceof Date) {
      object[key] = object[key].toString();
    }
  });

  return object;
};

const getCollections = () => {
  const collections = Meteor.connection._mongo_livedata_collections;

  const data1 = collections.reduce(
    (acc: object, collection: any) => ({
      [collection.name]: collection
        .find()
        .fetch()
        .map(cleanup),
    }),
    {},
  );

  sendMessage('minimongo-get-collections', data1);
};

export const MinimongoInjector = () => {
  Registry.register('minimongo-explorer', message => {
    message.eventType === 'minimongo-get-collections' && getCollections();
  });

  Tracker.autorun(function() {
    getCollections();
  });
};
