import { action, computed, observable } from 'mobx';
import { CollectionStore } from './CollectionStore';

interface Collections {
  [key: string]: Document[];
}

export class MinimongoStore {
  @observable collections: Collections = {};

  @observable activeCollection: string | null = null;

  activeCollectionDocuments = new CollectionStore();

  @computed
  get collectionNames() {
    return Object.keys(this.collections);
  }

  @action
  syncDocuments() {
    this.activeCollection &&
      this.activeCollectionDocuments.setCollection(
        this.collections[this.activeCollection],
      );
  }

  @action
  setCollections(collections: Collections) {
    this.collections = collections;

    this.syncDocuments();
  }

  @action
  setActiveCollection(collection: string | null) {
    this.activeCollection = collection;

    this.syncDocuments();
  }
}
