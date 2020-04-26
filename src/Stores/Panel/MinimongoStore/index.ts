import { debounce, flatten, toPairs } from 'lodash';
import { action, computed, observable } from 'mobx';
import { CollectionStore } from './CollectionStore';

export class MinimongoStore {
  activeCollectionDocuments = new CollectionStore();

  @observable collections: MinimongoCollections = {};
  @observable activeCollection: string | null = null;
  @observable search: string = '';
  @observable collectionColorMap: Record<string, string> = {};
  @observable isNavigatorVisible = false;

  @computed
  get totalDocuments() {
    return Object.values(this.collections).reduce(
      (acc, cur) => acc + cur.length,
      0,
    );
  }

  @computed
  get collectionNames() {
    return Object.keys(this.collections).sort();
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
        this.collections[this.activeCollection].map(document => ({
          collectionName: this.activeCollection as string,
          document,
        })),
      );
    } else {
      this.activeCollectionDocuments.setCollection(
        flatten(
          toPairs(this.collections).map(([collectionName, documents]) => {
            return documents.map(document => ({
              collectionName,
              document,
            }));
          }),
        ),
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

  @action
  setNavigatorVisible(isVisible: boolean) {
    this.isNavigatorVisible = isVisible;
  }
}
