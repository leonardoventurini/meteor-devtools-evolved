import { debounce } from 'lodash';
import { action, computed, observable } from 'mobx';
import { CollectionStore } from './CollectionStore';
import { JSONUtils } from '@/Utils/JSONUtils';
import { StringUtils } from '@/Utils/StringUtils';

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

  @computed
  get currentSize() {
    return this.activeCollectionDocuments.collection.reduce(
      (acc: number, cur: IDocumentWrapper) => acc + cur._size,
      0,
    );
  }

  @action
  syncDocuments() {
    if (this.activeCollection) {
      this.activeCollectionDocuments.setCollection(
        this.collections[this.activeCollection].map(document => {
          const _string = JSONUtils.stringify(document);

          return {
            collectionName: this.activeCollection as string,
            document,
            _string,
            _size: StringUtils.getSize(_string),
          };
        }),
      );
    } else {
      this.activeCollectionDocuments.setCollection(
        Object.entries(this.collections).flatMap(
          ([collectionName, documents]) => {
            return documents.map(document => {
              const _string = JSONUtils.stringify(document);

              return {
                collectionName,
                document,
                _string: JSONUtils.stringify(document),
                _size: StringUtils.getSize(_string),
              };
            });
          },
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
