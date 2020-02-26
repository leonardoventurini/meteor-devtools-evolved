import { warning } from '@/Log';
import { debounce } from 'lodash';
import { Registry, sendMessage } from './_Injector';

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
    warning(
      'Collections not initialized in the client yet. Possibly forgotten to be imported.',
    );
    return;
  }

  const data = Object.values(collections).reduce(
    (acc: object, collection: any) =>
      Object.assign(acc, {
        [collection.name]: collection
          .find()
          .fetch()
          .map(cleanup),
      }),
    {},
  );

  sendMessage('minimongo-get-collections', data);
};

export const updateCollections = debounce(getCollections, 500);

export const MinimongoInjector = () => {
  Registry.register('minimongo-explorer', message => {
    message.eventType === 'minimongo-get-collections' && getCollections();
  });
};
