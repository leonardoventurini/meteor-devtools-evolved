import { debounce, flatten } from 'lodash';
import { action, computed, observable } from 'mobx';
import { CollectionStore } from './CollectionStore';

export class MinimongoStore {
  @observable collections: MinimongoCollections = {};

  @observable activeCollection: string | null = null;

  @observable search: string = '';

  activeCollectionDocuments = new CollectionStore();

  @computed
  get collectionNames() {
    return Object.keys(this.collections);
  }

  @computed
  get filteredCollectionNames() {
    return this.collectionNames.filter(
      name =>
        !this.search || name.toLowerCase().includes(this.search.toLowerCase()),
    );
  }

  @action
  syncDocuments() {
    if (this.activeCollection) {
      this.activeCollectionDocuments.setCollection(
        this.collections[this.activeCollection],
      );
    } else {
      this.activeCollectionDocuments.setCollection(
        flatten(Object.values(this.collections)),
      );
    }
  }

  @action
  setCollections(collections: MinimongoCollections) {
    this.collections = collections;

    this.syncDocuments();
  }

  @action
  setActiveCollection(collection: string | null) {
    this.activeCollection = collection;

    this.syncDocuments();
  }

  setSearch = debounce(
    action((search: string) => (this.search = search)),
    250,
  );
}
