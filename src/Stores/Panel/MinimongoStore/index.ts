import { StringUtils } from '@/Utils/StringUtils';
import { debounce, flatten, toPairs } from 'lodash';
import { action, computed, observable } from 'mobx';
import { CollectionStore } from './CollectionStore';

export class MinimongoStore {
  @observable collections: MinimongoCollections = {};

  @observable activeCollection: string | null = null;

  @observable search: string = '';

  activeCollectionDocuments = new CollectionStore();

  availableColors: string[] = [];

  @observable collectionColorMap: Record<string, string> = {};

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
  expandColors() {
    const collectionsLength = Object.keys(this.collections).length;
    const colorsLength = this.availableColors.length;

    if (colorsLength < collectionsLength) {
      const extend = new Array(collectionsLength - colorsLength)
        .fill(null)
        .map(() => StringUtils.getRandomColor(3));
      this.availableColors.push(...extend);
    }

    this.mapColors();
  }

  @action
  mapColors() {
    this.collectionColorMap = Object.keys(this.collections).reduce(
      (acc, name, index) => ({
        ...acc,
        [name]: this.availableColors[index],
      }),
      {},
    );
  }

  @action
  syncDocuments() {
    this.expandColors();

    if (this.activeCollection) {
      this.activeCollectionDocuments.setCollection(
        this.collections[this.activeCollection].map(document => ({
          collectionName: this.activeCollection as string,
          color: this.collectionColorMap[this.activeCollection as string],
          document,
        })),
      );
    } else {
      this.activeCollectionDocuments.setCollection(
        flatten(
          toPairs(this.collections).map(([collectionName, documents]) => {
            return documents.map(document => ({
              collectionName,
              color: this.collectionColorMap[collectionName],
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
}
