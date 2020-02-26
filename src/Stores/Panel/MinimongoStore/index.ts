import { action, observable } from 'mobx';
import { CollectionStore } from './CollectionStore';

interface Collections {
  [key: string]: Document[];
}

export class MinimongoStore {
  @observable collections: Collections = {};

  @observable activeCollection: string | null = null;

  activeCollectionDocuments = new CollectionStore();

  @action
  setCollections(collections: Collections) {
    this.collections = collections;
  }

  @action
  setActiveCollection(collection: string | null) {
    this.activeCollection = collection;

    collection &&
      this.activeCollectionDocuments.setCollection(
        this.collections[collection],
      );
  }
}
