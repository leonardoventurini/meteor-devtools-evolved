import { debounce } from 'lodash';
import { Registry, sendMessage } from './_Injector';
import { warning } from '../Log';

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

  if (!collections) {
    warning('Collections Not Found.');
    return;
  }

  const data = collections.reduce(
    (acc: object, collection: any) => ({
      [collection.name]: collection
        .find()
        .fetch()
        .map(cleanup),
    }),
    {},
  );

  sendMessage('minimongo-get-collections', data);
};

export const updateCollections = debounce(getCollections, 200);

export const MinimongoInjector = () => {
  Registry.register('minimongo-explorer', message => {
    message.eventType === 'minimongo-get-collections' && getCollections();
  });
};
